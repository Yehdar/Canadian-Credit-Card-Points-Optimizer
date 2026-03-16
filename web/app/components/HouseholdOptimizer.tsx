"use client";

import { useState } from "react";
import { fetchHouseholdOptimization } from "@/lib/api";
import type { HouseholdOptimizationResult, Profile } from "@/lib/api";

interface HouseholdOptimizerProps {
  profiles: Profile[];
}

function formatCAD(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function HouseholdOptimizer({ profiles }: HouseholdOptimizerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(profiles.slice(0, 2).map((p) => p.id))
  );
  const [result, setResult]       = useState<HouseholdOptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

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
    <div className="rounded-2xl border border-[#EBEBEB] bg-white p-6 dark:border-[#1F1F1F] dark:bg-[#111111]">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-black dark:text-[#EDEDED]">
            Household Optimizer
          </h2>
          <p className="mt-0.5 text-[12px] text-[#A8A8A8] dark:text-[#555555]">
            Select 2–4 profiles to find the best card strategy for your household.
          </p>
        </div>
        {result?.isDualCardStrategy && (
          <span className="shrink-0 rounded-full border border-[#EBEBEB] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-black dark:border-[#1F1F1F] dark:text-[#EDEDED]">
            Dual-Card
          </span>
        )}
      </div>

      {/* Profile selection */}
      <div className="mb-5 flex flex-wrap gap-2">
        {profiles.map((profile) => {
          const selected = selectedIds.has(profile.id);
          return (
            <button
              key={profile.id}
              onClick={() => toggleProfile(profile.id)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                selected
                  ? "bg-black text-white dark:bg-[#EDEDED] dark:text-[#0A0A0A]"
                  : "border border-[#EBEBEB] text-[#6B6B6B] hover:border-black hover:text-black dark:border-[#1F1F1F] dark:text-[#888888] dark:hover:border-[#EDEDED] dark:hover:text-[#EDEDED]"
              }`}
            >
              {profile.name}
              {selected && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
                  <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleOptimize}
          disabled={!canOptimize || isLoading}
          className="rounded-full bg-black px-6 py-2.5 text-[13px] font-semibold text-white transition-all duration-150 active:scale-[0.98] hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#EDEDED] dark:text-[#0A0A0A]"
        >
          {isLoading ? "Optimizing…" : "Find Best Combo"}
        </button>
        {!canOptimize && (
          <p className="text-[12px] text-[#A8A8A8] dark:text-[#555555]">Select at least 2 profiles.</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Insight banner */}
          <div className="rounded-xl border border-[#EBEBEB] bg-[#F7F7F7] px-4 py-3 text-[13px] text-black dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#EDEDED]">
            {result.insight}
          </div>

          {/* Assignment cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            {result.assignments.map(({ profile, bestCard, breakdown, netAnnualValue }) => (
              <div
                key={profile.id}
                className="rounded-xl border border-[#EBEBEB] bg-[#F7F7F7] p-4 dark:border-[#1F1F1F] dark:bg-[#0A0A0A]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-black dark:text-[#EDEDED]">
                    {profile.name}
                  </span>
                  <span className="rounded-full border border-[#EBEBEB] px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-[#A8A8A8] dark:border-[#1F1F1F] dark:text-[#555555]">
                    {profile.profileType}
                  </span>
                </div>

                <p className="text-[14px] font-semibold text-black dark:text-[#EDEDED]">
                  {bestCard.name}
                </p>
                <p className="mt-0.5 text-[12px] text-[#6B6B6B] dark:text-[#888888]">
                  {bestCard.issuer} · {bestCard.pointsCurrency}
                </p>

                <div className="mt-3 space-y-1">
                  {breakdown.slice(0, 4).map((row) => (
                    <div key={row.category} className="flex justify-between text-[12px]">
                      <span className="capitalize text-[#6B6B6B] dark:text-[#888888]">{row.category}</span>
                      <span className="font-medium text-black dark:text-[#EDEDED]">+{formatCAD(row.valueCAD)}</span>
                    </div>
                  ))}
                  {breakdown.length > 4 && (
                    <p className="text-[12px] text-[#A8A8A8] dark:text-[#555555]">
                      +{breakdown.length - 4} more categories
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#EBEBEB] pt-3 dark:border-[#1F1F1F]">
                  <span className="text-[12px] text-[#A8A8A8] dark:text-[#555555]">Net / year</span>
                  <span className={`text-[13px] font-bold ${
                    netAnnualValue >= 0
                      ? "text-black dark:text-[#EDEDED]"
                      : "text-[#6B6B6B] dark:text-[#555555]"
                  }`}>
                    {netAnnualValue >= 0 ? "+" : ""}{formatCAD(netAnnualValue)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Combined total */}
          <div className="flex items-center justify-between rounded-xl border border-[#EBEBEB] bg-white px-5 py-4 dark:border-[#1F1F1F] dark:bg-[#111111]">
            <span className="text-[13px] font-medium text-[#6B6B6B] dark:text-[#888888]">
              Combined household annual value
            </span>
            <span className="text-[17px] font-bold text-black dark:text-[#EDEDED]">
              +{formatCAD(result.combinedNetAnnualValue)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
