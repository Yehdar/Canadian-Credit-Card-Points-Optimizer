"use client";

import { useState } from "react";
import { fetchHouseholdOptimization } from "@/lib/api";
import type { HouseholdOptimizationResult, Profile } from "@/lib/api";

const CARD_TYPE_ICONS: Record<string, string> = {
  amex:       "💳",
  visa:       "💳",
  mastercard: "💳",
};

const PROFILE_TYPE_EMOJI: Record<string, string> = {
  personal: "👤",
  business: "💼",
  partner:  "👥",
};

interface HouseholdOptimizerProps {
  profiles: Profile[];
}

export default function HouseholdOptimizer({ profiles }: HouseholdOptimizerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(profiles.slice(0, 2).map((p) => p.id))
  );
  const [result, setResult]     = useState<HouseholdOptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  function toggleProfile(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setResult(null);
  }

  async function handleOptimize() {
    if (selectedIds.size < 2) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await fetchHouseholdOptimization([...selectedIds]);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  const canOptimize = selectedIds.size >= 2;

  return (
    <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Household Optimizer
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Select 2–4 profiles to find the best card strategy for your household.
          </p>
        </div>
        {result?.isDualCardStrategy && (
          <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
            Dual-Card Strategy
          </span>
        )}
      </div>

      {/* Profile selection */}
      <div className="mb-4 flex flex-wrap gap-2">
        {profiles.map((profile) => {
          const selected = selectedIds.has(profile.id);
          return (
            <button
              key={profile.id}
              onClick={() => toggleProfile(profile.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                selected
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              <span>{PROFILE_TYPE_EMOJI[profile.profileType] ?? "👤"}</span>
              <span>{profile.name}</span>
              {selected && <span className="text-blue-200">✓</span>}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleOptimize}
        disabled={!canOptimize || isLoading}
        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Optimizing..." : "Find Best Combo"}
      </button>

      {!canOptimize && (
        <p className="mt-2 text-xs text-zinc-400">Select at least 2 profiles to compare.</p>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Insight banner */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
            {result.insight}
          </div>

          {/* Assignment cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {result.assignments.map(({ profile, bestCard, breakdown, netAnnualValue }) => (
              <div
                key={profile.id}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {PROFILE_TYPE_EMOJI[profile.profileType] ?? "👤"} {profile.name}
                  </span>
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    {profile.profileType}
                  </span>
                </div>

                <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  {CARD_TYPE_ICONS[bestCard.cardType]} {bestCard.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {bestCard.issuer} · {bestCard.pointsCurrency}
                </p>

                <div className="mt-3 space-y-1">
                  {breakdown.slice(0, 4).map((row) => (
                    <div key={row.category} className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="capitalize">{row.category}</span>
                      <span>+${row.valueCAD.toFixed(2)}</span>
                    </div>
                  ))}
                  {breakdown.length > 4 && (
                    <p className="text-xs text-zinc-400">+{breakdown.length - 4} more categories</p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-700">
                  <span className="text-xs text-zinc-500">Net annual value</span>
                  <span className={`text-sm font-bold ${netAnnualValue >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {netAnnualValue >= 0 ? "+" : ""}${netAnnualValue.toFixed(2)} CAD
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Combined total */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-3 dark:border-zinc-700 dark:bg-zinc-900">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Combined household annual value
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              +${result.combinedNetAnnualValue.toFixed(2)} CAD
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
