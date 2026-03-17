"use client";

import { useCallback, useRef, useState } from "react";
import { fetchRecommendations } from "@/lib/api";
import type { FormFilters, RecommendationResult, SpendingBreakdown } from "@/lib/api";

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
 * Optional `filters` are forwarded to the backend and bust the cache
 * when they differ from the previous call.
 */
type CalculateArgs =
  | { profileId: number; spending: SpendingBreakdown; filters?: FormFilters }
  | { spending: SpendingBreakdown; filters?: FormFilters };

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

  /** Tracks the spending + filters that produced the current results for cache comparison. */
  const lastSpendingRef = useRef<SpendingBreakdown | null>(null);
  const lastFiltersRef  = useRef<string | null>(null);

  const calculate = useCallback(async (args: CalculateArgs) => {
    // Cache hit: skip the round-trip only if spending AND filters are identical.
    if (lastSpendingRef.current) {
      const filtersKey = JSON.stringify(args.filters ?? null);
      const hit = spendingEqual(lastSpendingRef.current, args.spending)
               && lastFiltersRef.current === filtersKey;
      console.debug(
        "[useRecommendations] cache %s — spending:",
        hit ? "HIT (skipping fetch)" : "MISS (fetching)",
        JSON.stringify(args.spending)
      );
      if (hit) return;
    }

    setIsCalculating(true);
    setError(null);
    const t0 = Date.now();

    try {
      // For manual submits we always send spending inline so the backend uses
      // the live form values, not whatever is persisted in the DB.
      const fetchArgs: Parameters<typeof fetchRecommendations>[0] =
        "profileId" in args
          ? { profileId: args.profileId, filters: args.filters }
          : { spending: args.spending,   filters: args.filters };

      console.debug("[useRecommendations] → POST /api/recommendations", JSON.stringify(fetchArgs));
      const data = await fetchRecommendations(fetchArgs);

      // Enforce minimum loading buffer so the transition is perceptible
      const elapsed = Date.now() - t0;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise<void>((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }

      setResults(data);
      lastSpendingRef.current = { ...args.spending };
      lastFiltersRef.current  = JSON.stringify(args.filters ?? null);
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
    lastFiltersRef.current  = null;
  }, []);

  return { results, isCalculating, error, calculate, clearResults };
}
