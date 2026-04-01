"use client";

import { useState } from "react";
import { sendOptimizeRequest } from "@/lib/api";
import type {
  ChatMessage,
  SpendingFormSubmission,
  SpendingBreakdown,
  FormFilters,
  CardNetwork,
  RewardType,
  FeePreference,
  OptimizeRequest,
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
  content: "Ready to build your card strategy! Type **arsenal** for a multi-card setup that maximises every category, or **golden** for one perfect all-rounder.",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractTag(text: string, tag: string): string | null {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : null;
}

function stripTags(text: string): string {
  return text.replace(/<recommendation_data>[\s\S]*?<\/recommendation_data>/g, "").trim();
}

function toSubmission(data: {
  spending?: Partial<SpendingBreakdown> | null;
  filters?: Partial<FormFilters> | null;
  annualIncome?: number | null;
  householdIncome?: number | null;
  estimatedCreditScore?: number | null;
}): SpendingFormSubmission {
  const s = data.spending;
  const f = data.filters;
  const b = f?.benefits as Partial<FormFilters["benefits"]> | null | undefined;
  return {
    spending: {
      groceries:            s?.groceries            ?? 0,
      dining:               s?.dining               ?? 0,
      gas:                  s?.gas                  ?? 0,
      travel:               s?.travel               ?? 0,
      entertainment:        s?.entertainment        ?? 0,
      subscriptions:        s?.subscriptions        ?? 0,
      transit:              s?.transit              ?? 0,
      other:                s?.other                ?? 0,
      pharmacy:             s?.pharmacy             ?? 0,
      onlineShopping:       s?.onlineShopping       ?? 0,
      homeImprovement:      s?.homeImprovement      ?? 0,
      canadianTirePartners: s?.canadianTirePartners ?? 0,
      foreignPurchases:     s?.foreignPurchases     ?? 0,
    },
    filters: {
      rewardType:    (f?.rewardType    as RewardType)    ?? "both",
      feePreference: (f?.feePreference as FeePreference) ?? "include_fee",
      rogersOwner:   f?.rogersOwner   ?? false,
      amazonPrime:   f?.amazonPrime   ?? false,
      institutions:  f?.institutions  ?? [],
      networks:      (f?.networks     as CardNetwork[])  ?? ["visa", "mastercard", "amex"],
      benefits: {
        noForeignFee:   b?.noForeignFee   ?? false,
        airportLounge:  b?.airportLounge  ?? false,
        priorityTravel: b?.priorityTravel ?? false,
        freeCheckedBag: b?.freeCheckedBag ?? false,
      },
    },
    annualIncome:         data.annualIncome         ?? undefined,
    householdIncome:      data.householdIncome      ?? undefined,
    estimatedCreditScore: data.estimatedCreditScore ?? undefined,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useChat() {
  const [messages, setMessages]                     = useState<ChatMessage[]>([GREETING]);
  const [isLoading, setIsLoading]                   = useState(false);
  const [recommendationData, setRecommendationData] = useState<SpendingFormSubmission | null>(null);
  const [arsenalCards, setArsenalCards]             = useState<ArsenalCard[]>([]);

  // Always null in single-shot mode; kept so page.tsx compiles unchanged.
  const extractedData: ExtractedData | null = null;

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    // User is continuing after results — clear everything and start fresh.
    if (recommendationData) {
      setRecommendationData(null);
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

    const request: OptimizeRequest = {
      strategy,
      spending: EMPTY_SPENDING,
      filters:  DEFAULT_FILTERS,
    };

    try {
      const response = await sendOptimizeRequest(request);
      const recRaw   = extractTag(response.message, "recommendation_data");

      if (recRaw) {
        try {
          const parsed = JSON.parse(recRaw) as {
            spending?:             Partial<SpendingBreakdown> | null;
            filters?:              Partial<FormFilters> | null;
            annualIncome?:         number | null;
            householdIncome?:      number | null;
            estimatedCreditScore?: number | null;
            cards?: {
              name: string; purpose: string; description: string; visualConfig?: VisualConfig;
            }[];
          };

          setRecommendationData(toSubmission(parsed));

          if (parsed.cards && parsed.cards.length > 0) {
            setArsenalCards(parsed.cards.map(c => ({
              name:         c.name,
              purpose:      c.purpose     ?? "",
              description:  c.description ?? "",
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

  const isDone = !!recommendationData;

  return { messages, isLoading, extractedData, recommendationData, arsenalCards, isDone, sendMessage, addBotMessage };
}
