"use client";

import { useState } from "react";
import { sendOptimizeRequest } from "@/lib/api";
import type {
  ChatMessage,
  SpendingBreakdown,
  FormFilters,
  CardNetwork,
  RewardType,
  FeePreference,
  OptimizeRequest,
  RecommendationResult,
} from "@/lib/api";

// Visual metadata for 3D card rendering, emitted by Gemini per card.
export interface VisualConfig {
  baseColor: string;
  metalness: number;
  roughness: number;
  finish: "matte" | "glossy" | "brushed_metal";
  brandDomain: string;
  companyName: string;
  network: "visa" | "mastercard" | "amex";
  cardNumber: string;
  isMetal: boolean;
}

// A single card in the Arsenal with Gemini-authored purpose and description.
export interface ArsenalCard {
  name: string;
  purpose: string;
  description: string;
  visualConfig?: VisualConfig;
}

// Full card data returned by Gemini, including calculated values.
interface GeminiCard {
  name: string;
  issuer: string;
  annualFee: number;
  pointsCurrency: string;
  cardType: string;
  isPointsBased: boolean;
  breakdown: Array<{ category: string; spent: number; pointsEarned: number; valueCAD: number }>;
  totalPointsEarned: number;
  totalValueCAD: number;
  netAnnualValue: number;
  eligibilityWarning?: string | null;
  purpose: string;
  description: string;
  visualConfig?: VisualConfig;
}

// Kept for LiveProfileSidebar compatibility — always null in single-shot mode.
export interface ExtractedData {
  spending: {
    groceries: number | null; dining: number | null; gas: number | null;
    travel: number | null; entertainment: number | null; subscriptions: number | null;
    transit: number | null; pharmacy: number | null; onlineShopping: number | null;
    homeImprovement: number | null; canadianTirePartners: number | null;
    foreignPurchases: number | null; other: number | null;
  } | null;
  filters: {
    rewardType: RewardType | null; feePreference: FeePreference | null;
    rogersOwner: boolean | null; amazonPrime: boolean | null;
    institutions: string[] | null; networks: CardNetwork[] | null;
    benefits: {
      noForeignFee: boolean | null; airportLounge: boolean | null;
      priorityTravel: boolean | null; freeCheckedBag: boolean | null;
    } | null;
  } | null;
  annualIncome: number | null;
  householdIncome: number | null;
  estimatedCreditScore: number | null;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const EMPTY_SPENDING: SpendingBreakdown = {
  groceries: 0, dining: 0, gas: 0, travel: 0, entertainment: 0,
  subscriptions: 0, transit: 0, other: 0, pharmacy: 0,
  onlineShopping: 0, homeImprovement: 0, canadianTirePartners: 0, foreignPurchases: 0,
};

const DEFAULT_FILTERS: FormFilters = {
  rewardType: "both",
  feePreference: "include_fee",
  rogersOwner: false,
  amazonPrime: false,
  institutions: [],
  networks: ["visa", "mastercard", "amex"],
  benefits: { noForeignFee: false, airportLounge: false, priorityTravel: false, freeCheckedBag: false },
};

const GREETING: ChatMessage = {
  role: "model",
  content: "Ready to build your card strategy! Type **arsenal** for a multi-card setup that maximises every category, or **one card** to find your single best match.",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractTag(text: string, tag: string): string | null {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : null;
}

function stripTags(text: string): string {
  return text.replace(/<recommendation_data>[\s\S]*?<\/recommendation_data>/g, "").trim();
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useChat() {
  const [messages, setMessages]       = useState<ChatMessage[]>([GREETING]);
  const [isLoading, setIsLoading]     = useState(false);
  const [results, setResults]         = useState<RecommendationResult[]>([]);
  const [arsenalCards, setArsenalCards] = useState<ArsenalCard[]>([]);

  // Always null in single-shot mode; kept so LiveProfileSidebar compiles unchanged.
  const extractedData: ExtractedData | null = null;

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    // User is continuing after results — clear everything and start fresh,
    // but preserve the previous user message as spending context for Gemini.
    let spendingContext = "";
    if (results.length > 0) {
      const prevUserMsg = messages.find(m => m.role === "user");
      if (prevUserMsg) spendingContext = prevUserMsg.content;
      setResults([]);
      setArsenalCards([]);
      setMessages([]);
    }

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const lc = text.toLowerCase();
    const strategy =
      lc.includes("arsenal") || lc.includes("multi") || lc.includes("multiple")
        ? "arsenal"
        : "simple";

    // If this is a follow-up, prepend the previous spending profile so Gemini
    // has the data it needs to calculate point values.
    const effectiveUserText = spendingContext
      ? `Context from user's previous message (spending profile):\n${spendingContext}\n\nNew request: ${text.trim()}`
      : text.trim();

    const request: OptimizeRequest = {
      strategy,
      spending: EMPTY_SPENDING,
      filters:  DEFAULT_FILTERS,
      userText: effectiveUserText,
    };

    try {
      const response = await sendOptimizeRequest(request);
      const recRaw   = extractTag(response.message, "recommendation_data");

      if (recRaw) {
        try {
          const parsed = JSON.parse(recRaw) as {
            cards?: GeminiCard[];
            annualIncome?: number | null;
            householdIncome?: number | null;
            estimatedCreditScore?: number | null;
          };

          if (parsed.cards && parsed.cards.length > 0) {
            setResults(
              parsed.cards.map((c, i) => ({
                card: {
                  id:             i,
                  name:           c.name,
                  issuer:         c.issuer         ?? "",
                  annualFee:      c.annualFee       ?? 0,
                  pointsCurrency: c.pointsCurrency  ?? "Cash Back",
                  cardType:       c.cardType        ?? "visa",
                  isPointsBased:  c.isPointsBased   ?? false,
                },
                breakdown:          c.breakdown         ?? [],
                totalPointsEarned:  c.totalPointsEarned ?? 0,
                totalValueCAD:      c.totalValueCAD      ?? 0,
                netAnnualValue:     c.netAnnualValue     ?? 0,
                eligibilityWarning: c.eligibilityWarning ?? undefined,
              }))
            );
            setArsenalCards(parsed.cards.map(c => ({
              name:         c.name,
              purpose:      c.purpose      ?? "",
              description:  c.description  ?? "",
              visualConfig: c.visualConfig,
            })));
          }
        } catch {
          // Malformed JSON from Gemini — swallow and show fallback message.
        }
      }

      const displayText = recRaw
        ? "Your card strategy is ready — opening your Arsenal now!"
        : stripTags(response.message) || "Couldn't generate a strategy. Please try again.";

      setMessages(prev => [...prev, { role: "model", content: displayText }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "model", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Called when the Arsenal modal closes — adds a follow-up prompt.
  function addBotMessage(text: string) {
    setMessages(prev => [...prev, { role: "model", content: text }]);
  }

  // Resets all chat state back to the initial greeting — call when switching profiles.
  function resetChat() {
    setMessages([GREETING]);
    setResults([]);
    setArsenalCards([]);
    setIsLoading(false);
  }

  const isDone = results.length > 0;

  return { messages, isLoading, extractedData, results, arsenalCards, isDone, sendMessage, addBotMessage, resetChat };
}
