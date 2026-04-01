"use client";

import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "@/lib/api";
import type { ChatMessage, SpendingFormSubmission, CardNetwork, RewardType, FeePreference } from "@/lib/api";

// Partial representation of extracted data during the conversation.
// Fields are null until Gemini has gathered that information.
export interface ExtractedData {
  spending: {
    groceries: number | null;
    dining: number | null;
    gas: number | null;
    travel: number | null;
    entertainment: number | null;
    subscriptions: number | null;
    transit: number | null;
    pharmacy: number | null;
    onlineShopping: number | null;
    homeImprovement: number | null;
    canadianTirePartners: number | null;
    foreignPurchases: number | null;
    other: number | null;
  } | null;
  filters: {
    rewardType: RewardType | null;
    feePreference: FeePreference | null;
    rogersOwner: boolean | null;
    amazonPrime: boolean | null;
    institutions: string[] | null;
    networks: CardNetwork[] | null;
    benefits: {
      noForeignFee: boolean | null;
      airportLounge: boolean | null;
      priorityTravel: boolean | null;
      freeCheckedBag: boolean | null;
    } | null;
  } | null;
  annualIncome: number | null;
  householdIncome: number | null;
  estimatedCreditScore: number | null;
}

// A single card in the Arsenal with Gemini-authored purpose and description.
export interface ArsenalCard {
  name: string;
  purpose: string;
  description: string;
}

function extractTag(text: string, tag: string): string | null {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : null;
}

function stripTags(text: string): string {
  return text
    .replace(/<extracted_data>[\s\S]*?<\/extracted_data>/g, "")
    .replace(/<recommendation_data>[\s\S]*?<\/recommendation_data>/g, "")
    .trim();
}

function parseExtractedData(text: string): ExtractedData | null {
  const raw = extractTag(text, "extracted_data");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ExtractedData;
  } catch {
    return null;
  }
}

// Convert ExtractedData (with nulls) to a complete SpendingFormSubmission for the API.
function toSubmission(data: ExtractedData): SpendingFormSubmission {
  const s = data.spending;
  const f = data.filters;
  const b = f?.benefits;
  return {
    spending: {
      groceries:             s?.groceries             ?? 0,
      dining:                s?.dining                ?? 0,
      gas:                   s?.gas                   ?? 0,
      travel:                s?.travel                ?? 0,
      entertainment:         s?.entertainment         ?? 0,
      subscriptions:         s?.subscriptions         ?? 0,
      transit:               s?.transit               ?? 0,
      other:                 s?.other                 ?? 0,
      pharmacy:              s?.pharmacy              ?? 0,
      onlineShopping:        s?.onlineShopping        ?? 0,
      homeImprovement:       s?.homeImprovement       ?? 0,
      canadianTirePartners:  s?.canadianTirePartners  ?? 0,
      foreignPurchases:      s?.foreignPurchases      ?? 0,
    },
    filters: {
      rewardType:    f?.rewardType    ?? "both",
      feePreference: f?.feePreference ?? "include_fee",
      rogersOwner:   f?.rogersOwner   ?? false,
      amazonPrime:   f?.amazonPrime   ?? false,
      institutions:  f?.institutions  ?? [],
      networks:      f?.networks      ?? ["visa", "mastercard", "amex"],
      benefits: {
        noForeignFee:   b?.noForeignFee   ?? false,
        airportLounge:  b?.airportLounge  ?? false,
        priorityTravel: b?.priorityTravel ?? false,
        freeCheckedBag: b?.freeCheckedBag ?? false,
      },
    },
    annualIncome:          data.annualIncome          ?? undefined,
    householdIncome:       data.householdIncome       ?? undefined,
    estimatedCreditScore:  data.estimatedCreditScore  ?? undefined,
  };
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [recommendationData, setRecommendationData] = useState<SpendingFormSubmission | null>(null);
  const [arsenalCards, setArsenalCards] = useState<ArsenalCard[]>([]);
  // When true, re-enables the chat input even after recommendationData is set (exit loop).
  const [forceOpen, setForceOpen] = useState(false);

  // Tracks the full conversation history sent to the API (includes the hidden starter message).
  const apiMessagesRef = useRef<ChatMessage[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      initChat();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function initChat() {
    setIsLoading(true);
    try {
      // Send a silent starter so Gemini has a user turn to respond to.
      // This message is NOT added to the display state.
      const starter: ChatMessage = { role: "user", content: "Hello, I'd like to find the best credit card for me." };
      apiMessagesRef.current = [starter];

      const response = await sendChatMessage(apiMessagesRef.current);
      const cleanText = stripTags(response.message);
      const extracted = parseExtractedData(response.message);
      if (extracted) setExtractedData(extracted);

      const modelMsg: ChatMessage = { role: "model", content: cleanText };
      apiMessagesRef.current = [...apiMessagesRef.current, modelMsg];
      setMessages([modelMsg]);
    } catch {
      setMessages([{ role: "model", content: "Hi! I'm having trouble connecting right now. Please check that the backend is running and your Gemini API key is set." }]);
    } finally {
      setIsLoading(false);
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const newApiMessages = [...apiMessagesRef.current, userMsg];
    apiMessagesRef.current = newApiMessages;
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    // If the user sends a new message after the exit loop, close forceOpen
    // so isDone re-triggers if Gemini produces another recommendation_data.
    setForceOpen(false);

    try {
      const response = await sendChatMessage(newApiMessages);
      const cleanText = stripTags(response.message);
      const extracted = parseExtractedData(response.message);
      if (extracted) setExtractedData(extracted);

      if (response.isDone) {
        const recRaw = extractTag(response.message, "recommendation_data");
        if (recRaw) {
          try {
            const parsed = JSON.parse(recRaw) as ExtractedData & {
              cards?: { name: string; purpose: string; description: string }[];
              cardInsights?: { cardName: string; insight: string }[];
            };
            setRecommendationData(toSubmission(parsed));

            if (parsed.cards && parsed.cards.length > 0) {
              setArsenalCards(parsed.cards.map(c => ({
                name: c.name,
                purpose: c.purpose ?? "",
                description: c.description ?? "",
              })));
            } else if (parsed.cardInsights && parsed.cardInsights.length > 0) {
              // Backwards-compat: old cardInsights format
              setArsenalCards(parsed.cardInsights.map(c => ({
                name: c.cardName,
                purpose: "",
                description: c.insight,
              })));
            }
          } catch {
            // Fall back to converting the last extractedData
            if (extracted) setRecommendationData(toSubmission(extracted));
          }
        }
      }

      const modelMsg: ChatMessage = { role: "model", content: cleanText };
      apiMessagesRef.current = [...apiMessagesRef.current, modelMsg];
      setMessages(prev => [...prev, modelMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "model", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Inject a bot message into the visible chat and re-enable the input.
  // Used by the exit loop when the Arsenal modal is closed.
  function addBotMessage(text: string) {
    setMessages(prev => [...prev, { role: "model", content: text }]);
    setForceOpen(true);
  }

  const isDone = !forceOpen && !!recommendationData;

  return { messages, isLoading, extractedData, recommendationData, arsenalCards, isDone, sendMessage, addBotMessage };
}
