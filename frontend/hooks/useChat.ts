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
  SavedCard,
  ExtractedData,
  SavedCardVisualConfig,
} from "@/lib/api";

export type { ExtractedData };
// Local alias + re-export so VisualConfig is usable within this file and by ThreeDCard.
type VisualConfig = SavedCardVisualConfig;
export type { VisualConfig };

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
  content: "Ready to join millions of Canadians by building your credit card arsenal and optimizing points? \n\n To start, reference the spending categories to the right and type in as much information you can about your spending habits. \n\n Then when the green button lights on, you can press it and will provide with what cards we believe are right for you!",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractTag(text: string, tag: string): string | null {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : null;
}

function stripTags(text: string): string {
  return text.replace(/<recommendation_data>[\s\S]*?<\/recommendation_data>/g, "").trim();
}

function stripExtractTag(text: string): string {
  return text.replace(/<extracted_data>[\s\S]*?<\/extracted_data>/g, "").trim();
}

function toSpendingBreakdown(spending: ExtractedData["spending"]): SpendingBreakdown {
  if (!spending) return EMPTY_SPENDING;
  return {
    groceries:            spending.groceries            ?? 0,
    dining:               spending.dining               ?? 0,
    gas:                  spending.gas                  ?? 0,
    travel:               spending.travel               ?? 0,
    entertainment:        spending.entertainment        ?? 0,
    subscriptions:        spending.subscriptions        ?? 0,
    transit:              spending.transit              ?? 0,
    other:                spending.other                ?? 0,
    pharmacy:             spending.pharmacy             ?? 0,
    onlineShopping:       spending.onlineShopping       ?? 0,
    homeImprovement:      spending.homeImprovement      ?? 0,
    canadianTirePartners: spending.canadianTirePartners ?? 0,
    foreignPurchases:     spending.foreignPurchases     ?? 0,
  };
}

function toFormFilters(filters: ExtractedData["filters"]): FormFilters {
  if (!filters) return DEFAULT_FILTERS;
  return {
    rewardType:    (filters.rewardType    ?? DEFAULT_FILTERS.rewardType) as RewardType,
    feePreference: (filters.feePreference ?? DEFAULT_FILTERS.feePreference) as FeePreference,
    rogersOwner:   filters.rogersOwner   ?? false,
    amazonPrime:   filters.amazonPrime   ?? false,
    institutions:  filters.institutions  ?? [],
    networks:      (filters.networks     ?? DEFAULT_FILTERS.networks) as CardNetwork[],
    benefits: {
      noForeignFee:   filters.benefits?.noForeignFee   ?? false,
      airportLounge:  filters.benefits?.airportLounge  ?? false,
      priorityTravel: filters.benefits?.priorityTravel ?? false,
      freeCheckedBag: filters.benefits?.freeCheckedBag ?? false,
    },
  };
}

function parseGeminiCards(recRaw: string): { results: RecommendationResult[]; arsenalCards: ArsenalCard[] } | null {
  try {
    const parsed = JSON.parse(recRaw) as {
      cards?: GeminiCard[];
      annualIncome?: number | null;
      householdIncome?: number | null;
      estimatedCreditScore?: number | null;
    };
    if (!parsed.cards || parsed.cards.length === 0) return null;
    return {
      results: parsed.cards.map((c, i) => ({
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
      })),
      arsenalCards: parsed.cards.map(c => ({
        name:         c.name,
        purpose:      c.purpose      ?? "",
        description:  c.description  ?? "",
        visualConfig: c.visualConfig,
      })),
    };
  } catch {
    return null;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useChat() {
  const [messages, setMessages]           = useState<ChatMessage[]>([GREETING]);
  const [isLoading, setIsLoading]         = useState(false);
  const [results, setResults]             = useState<RecommendationResult[]>([]);
  const [arsenalCards, setArsenalCards]   = useState<ArsenalCard[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Build cumulative context: all prior user messages + this one
    const allUserMessages = [...messages.filter(m => m.role === "user"), userMsg]
      .map(m => m.content)
      .join("\n");

    const request: OptimizeRequest = {
      strategy: "extract",
      spending: EMPTY_SPENDING,
      filters:  DEFAULT_FILTERS,
      userText: allUserMessages,
    };

    try {
      const response = await sendOptimizeRequest(request);
      const extractedRaw = extractTag(response.message, "extracted_data");

      if (extractedRaw) {
        try {
          const parsed = JSON.parse(extractedRaw) as ExtractedData;
          setExtractedData(parsed);
        } catch { /* malformed JSON — keep previous extractedData */ }
      }

      const displayText = stripExtractTag(response.message) ||
        "Got it! Keep adding details or click **Get Cards Now** when ready.";
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

  async function getCards() {
    if (isLoading) return;
    setResults([]);
    setArsenalCards([]);
    setIsLoading(true);

    const allText = messages.map(m => m.content).join(" ").toLowerCase();
    const strategy =
      allText.includes("one card") || allText.includes("single card") ? "simple" : "arsenal";

    const request: OptimizeRequest = {
      strategy,
      spending:             toSpendingBreakdown(extractedData?.spending ?? null),
      filters:              toFormFilters(extractedData?.filters ?? null),
      annualIncome:         extractedData?.annualIncome         ?? undefined,
      householdIncome:      extractedData?.householdIncome      ?? undefined,
      estimatedCreditScore: extractedData?.estimatedCreditScore ?? undefined,
      userText: messages.filter(m => m.role === "user").map(m => m.content).join("\n"),
    };

    try {
      const response = await sendOptimizeRequest(request);
      const recRaw = extractTag(response.message, "recommendation_data");

      if (recRaw) {
        const parsed = parseGeminiCards(recRaw);
        if (parsed) {
          setResults(parsed.results);
          setArsenalCards(parsed.arsenalCards);
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

  // Re-sync a saved card: uses the saved profile snapshot if available,
  // otherwise falls back to reconstructing spending from the card's breakdown.
  async function reSyncCard(card: SavedCard, snapshot?: ExtractedData | null) {
    if (isLoading) return;

    let resolvedExtracted: ExtractedData;
    let contextMsg: ChatMessage;

    if (snapshot?.spending) {
      // Use the full saved context — spending, income, credit score, filters
      resolvedExtracted = snapshot;
      const sorted = Object.entries(snapshot.spending)
        .filter(([, v]) => v !== null && v > 0)
        .sort(([, a], [, b]) => (b as number) - (a as number));
      const topSpends = sorted.map(([k, v]) => `${k} $${Math.round(v as number)}`).join(", ");
      contextMsg = { role: "user", content: `Re-syncing arsenal using saved profile. Monthly spending: ${topSpends}` };
    } else {
      // Fallback: reconstruct spending from the card's annual breakdown → monthly
      const spending: ExtractedData["spending"] = {
        groceries: null, dining: null, gas: null, travel: null,
        entertainment: null, subscriptions: null, transit: null, other: null,
        pharmacy: null, onlineShopping: null, homeImprovement: null,
        canadianTirePartners: null, foreignPurchases: null,
      };
      for (const b of card.breakdown ?? []) {
        const key = b.category as keyof NonNullable<ExtractedData["spending"]>;
        if (key in spending) {
          (spending as Record<string, number | null>)[key] = b.spent / 12;
        }
      }
      resolvedExtracted = { spending, filters: null, annualIncome: null, householdIncome: null, estimatedCreditScore: null };
      const sorted = [...(card.breakdown ?? [])].sort((a, b) => b.spent - a.spent);
      const topSpends = sorted.map(b => `${b.category} $${Math.round(b.spent / 12)}`).join(", ");
      contextMsg = { role: "user", content: `Re-syncing arsenal. Monthly spending: ${topSpends}` };
    }

    setExtractedData(resolvedExtracted);
    setMessages([GREETING, contextMsg]);
    setResults([]);
    setArsenalCards([]);

    setIsLoading(true);
    const request: OptimizeRequest = {
      strategy: "arsenal",
      spending: toSpendingBreakdown(resolvedExtracted.spending ?? null),
      filters:  toFormFilters(resolvedExtracted.filters ?? null),
      annualIncome:         resolvedExtracted.annualIncome         ?? undefined,
      householdIncome:      resolvedExtracted.householdIncome      ?? undefined,
      estimatedCreditScore: resolvedExtracted.estimatedCreditScore ?? undefined,
      userText: contextMsg.content,
    };

    try {
      const response = await sendOptimizeRequest(request);
      const recRaw = extractTag(response.message, "recommendation_data");
      if (recRaw) {
        const parsed = parseGeminiCards(recRaw);
        if (parsed) { setResults(parsed.results); setArsenalCards(parsed.arsenalCards); }
      }
      const displayText = recRaw
        ? "Your card strategy is ready — opening your Arsenal now!"
        : stripTags(response.message) || "Couldn't generate a strategy. Please try again.";
      setMessages(prev => [...prev, { role: "model", content: displayText }]);
    } catch {
      setMessages(prev => [...prev, { role: "model", content: "Sorry, something went wrong. Please try again." }]);
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
    setExtractedData(null);
    setIsLoading(false);
  }

  const isDone = results.length > 0;

  return { messages, isLoading, extractedData, results, arsenalCards, isDone, sendMessage, getCards, reSyncCard, addBotMessage, resetChat };
}
