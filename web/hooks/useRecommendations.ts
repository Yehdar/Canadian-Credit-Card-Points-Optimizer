"use client";

import { useCallback, useRef, useState } from "react";
import { fetchRecommendations } from "@/lib/api";
import type { RecommendationResult, SpendingBreakdown } from "@/lib/api";

/** Minimum perceived-loading duration in milliseconds. */
const MIN_LOADING_MS = 800;

/** O(n) deep equality over the fixed SpendingBreakdown shape. */
function spendingEqual(a: SpendingBreakdown, b: SpendingBreakdown): boolean {
  return (
    a.groceries     === b.groceries     &&
    a.dining        === b.dining        &&
    a.gas           === b.gas           &&
    a.travel        === b.travel        &&
    a.entertainment === b.entertainment &&
    a.subscriptions === b.subscriptions &&
    a.transit       === b.transit       &&
    a.other         === b.other
  );
}

/**
 * Unified args type.
 * Always pass `spending` for cache comparison — the hook uses `profileId`
 * for the API call when present so the backend stays authoritative.
 */
type CalculateArgs =
  | { profileId: number; spending: SpendingBreakdown }
  | { spending: SpendingBreakdown };

interface UseRecommendationsReturn {
  results: RecommendationResult[];
  isCalculating: boolean;
  error: string | null;
  calculate: (args: CalculateArgs) => Promise<void>;
  clearResults: () => void;
}

export function useRecommendations(): UseRecommendationsReturn {
  const [results, setResults]           = useState<RecommendationResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError]               = useState<string | null>(null);

  /** Tracks the spending that produced the current results for cache comparison. */
  const lastSpendingRef = useRef<SpendingBreakdown | null>(null);

  const calculate = useCallback(async (args: CalculateArgs) => {
    // Cache hit: skip the round-trip if spending is identical
    if (lastSpendingRef.current && spendingEqual(lastSpendingRef.current, args.spending)) {
      return;
    }

    setIsCalculating(true);
    setError(null);
    const t0 = Date.now();

    try {
      const fetchArgs =
        "profileId" in args
          ? { profileId: args.profileId }
          : { spending: args.spending };

      const data = await fetchRecommendations(fetchArgs);

      // Enforce minimum loading buffer so the transition is perceptible
      const elapsed = Date.now() - t0;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise<void>((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }

      setResults(data);
      lastSpendingRef.current = { ...args.spending };
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Is the backend running?"
      );
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    lastSpendingRef.current = null;
  }, []);

  return { results, isCalculating, error, calculate, clearResults };
}
