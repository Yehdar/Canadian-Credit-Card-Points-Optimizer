"use client";

import { useEffect } from "react";
import type { RecommendationResult } from "@/lib/api";
import { VisaMark, MastercardMark, AmexMark } from "./NetworkMarks";

interface ArsenalModalProps {
  results: RecommendationResult[];
  insights: Record<string, string>;   // cardName → Gemini insight
  onClose: () => void;                // "Back to Chat"
}

const NETWORK_MARKS: Record<string, React.ReactNode> = {
  visa:       <VisaMark />,
  mastercard: <MastercardMark />,
  amex:       <AmexMark />,
};

const CATEGORY_LABELS: Record<string, string> = {
  groceries:              "Groceries",
  dining:                 "Dining",
  gas:                    "Gas",
  travel:                 "Travel",
  entertainment:          "Entertainment",
  subscriptions:          "Subscriptions",
  transit:                "Transit",
  other:                  "Other",
  pharmacy:               "Pharmacy",
  online_shopping:        "Online Shopping",
  home_improvement:       "Home Improvement",
  canadian_tire_partners: "Canadian Tire Partners",
  foreign_purchases:      "Foreign Purchases",
};

function formatCAD(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function ArsenalCard({
  result,
  index,
  insight,
}: {
  result: RecommendationResult;
  index: number;
  insight: string | null;
}) {
  const isBest = index === 0;
  const isPositive = result.netAnnualValue >= 0;
  const maxValue = Math.max(...result.breakdown.map((b) => b.valueCAD), 0.01);

  return (
    <div
      className={`rounded-2xl bg-white p-6 dark:bg-[#292A2D] ${
        isBest
          ? "border border-black dark:border-[#E8EAED]"
          : "border border-[#DADCE0] dark:border-[#3C4043]"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
              #{index + 1}
            </span>
            {isBest && (
              <span className="rounded-full bg-black px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white dark:bg-[#E8EAED] dark:text-[#202124]">
                Best Match
              </span>
            )}
          </div>

          <h3 className="text-[17px] font-semibold leading-tight tracking-tight text-black dark:text-[#E8EAED]">
            {result.card.name}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">{result.card.issuer}</span>
            <span className="text-[#DADCE0] dark:text-[#3C4043]">·</span>
            <span className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">{result.card.pointsCurrency}</span>
            <span className="text-[#DADCE0] dark:text-[#3C4043]">·</span>
            <span className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">{formatCAD(result.card.annualFee)}/yr</span>
            <span className="ml-1">{NETWORK_MARKS[result.card.cardType]}</span>
          </div>
        </div>

        {/* Net value hero stat */}
        <div className="shrink-0 text-right">
          <p className={`text-[28px] font-bold leading-none tracking-tight ${
            isPositive ? "text-black dark:text-[#E8EAED]" : "text-[#5F6368]"
          }`}>
            {isPositive ? "+" : ""}{formatCAD(result.netAnnualValue)}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
            net / year
          </p>
        </div>
      </div>

      {/* Eligibility warning */}
      {result.eligibilityWarning && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/30">
          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
            <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
            <circle cx="8" cy="11.5" r="0.625" fill="currentColor"/>
          </svg>
          <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
            {result.eligibilityWarning}
          </p>
        </div>
      )}

      {/* Gemini Insight block */}
      {insight && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#E8F0FE] bg-[#F0F4FF] px-4 py-3 dark:border-[#1A3A6B] dark:bg-[#1A2A4A]">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1A73E8] text-[9px] font-bold text-white">
            CG
          </div>
          <p className="text-[12px] leading-relaxed text-[#1A73E8] dark:text-[#7BAAF7]">
            {insight}
          </p>
        </div>
      )}

      {/* Stats strip */}
      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#DADCE0] bg-[#DADCE0] dark:border-[#3C4043] dark:bg-[#3C4043]">
        <div className="bg-[#F1F3F4] px-4 py-3 dark:bg-[#202124]">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
            Rewards value
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-black dark:text-[#E8EAED]">
            {formatCAD(result.totalValueCAD)}
          </p>
        </div>
        <div className="bg-[#F1F3F4] px-4 py-3 dark:bg-[#202124]">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
            Points earned
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-black dark:text-[#E8EAED]">
            {result.totalPointsEarned.toLocaleString("en-CA")}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      {result.breakdown.length > 0 && (
        <div className="mt-4">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
            Category breakdown
          </p>
          <div className="space-y-2.5">
            {result.breakdown.map((b) => (
              <div key={b.category}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">
                    {CATEGORY_LABELS[b.category] ?? b.category}
                  </span>
                  <span className="text-[12px] font-medium text-black dark:text-[#E8EAED]">
                    {formatCAD(b.valueCAD)}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-[#DADCE0] dark:bg-[#3C4043]">
                  <div
                    className="h-full rounded-full bg-black transition-all duration-500 dark:bg-[#E8EAED]"
                    style={{ width: `${Math.round((b.valueCAD / maxValue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArsenalModal({ results, insights, onClose }: ArsenalModalProps) {
  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent background scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="relative flex w-full max-w-2xl flex-col bg-[#F8F9FA] dark:bg-[#202124] lg:m-6 lg:rounded-2xl lg:shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DADCE0] px-6 py-5 dark:border-[#3C4043]">
          <div>
            <h2 className="text-[18px] font-bold tracking-tight text-black dark:text-[#E8EAED]">
              Your Card Arsenal
            </h2>
            <p className="mt-0.5 text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">
              Ranked by net annual value — CardGenius insights included
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close arsenal"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5F6368] transition hover:bg-[#F1F3F4] dark:text-[#9AA0A6] dark:hover:bg-[#3C4043]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable card list */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            {results.map((result, i) => (
              <ArsenalCard
                key={result.card.id}
                result={result}
                index={i}
                insight={insights[result.card.name] ?? null}
              />
            ))}
          </div>

          {/* Footer spacer for "Back to Chat" button clearance */}
          <div className="h-4" />
        </div>

        {/* Footer */}
        <div className="border-t border-[#DADCE0] px-6 py-4 dark:border-[#3C4043]">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-[#DADCE0] bg-white py-3 text-[13px] font-medium text-[#202124] transition hover:bg-[#F1F3F4] dark:border-[#3C4043] dark:bg-[#292A2D] dark:text-[#E8EAED] dark:hover:bg-[#3C4043]"
          >
            ← Back to Chat
          </button>
        </div>
      </div>
    </div>
  );
}
