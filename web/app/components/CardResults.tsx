"use client";

import { useState } from "react";
import type { RecommendationResult } from "@/lib/api";
import { VisaMark, MastercardMark, AmexMark } from "./NetworkMarks";

interface CardResultsProps {
  results: RecommendationResult[];
  isCalculating?: boolean;
}

const NETWORK_MARKS: Record<string, React.ReactNode> = {
  visa:       <VisaMark />,
  mastercard: <MastercardMark />,
  amex:       <AmexMark />,
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

const CATEGORY_LABELS: Record<string, string> = {
  groceries:     "Groceries",
  dining:        "Dining",
  gas:           "Gas",
  travel:        "Travel",
  entertainment: "Entertainment",
  subscriptions: "Subscriptions",
  transit:       "Transit",
  other:         "Other",
};

function formatCAD(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/* ── Single card ────────────────────────────────────────────────────────── */

function ResultCard({ result, index }: { result: RecommendationResult; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const isPositive = result.netAnnualValue >= 0;
  const isBest     = index === 0;
  const maxValue   = Math.max(...result.breakdown.map((b) => b.valueCAD), 0.01);

  return (
    <div
      className={`group rounded-2xl bg-white p-6 transition-all duration-200 dark:bg-[#292A2D] ${
        isBest
          ? "border border-black dark:border-[#E8EAED]"
          : "border border-[#DADCE0] hover:border-[#BDC1C6] dark:border-[#3C4043] dark:hover:border-[#5F6368]"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Rank + badge */}
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

          {/* Card name */}
          <h3 className="text-[17px] font-semibold leading-tight tracking-tight text-black dark:text-[#E8EAED]">
            {result.card.name}
          </h3>

          {/* Meta row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">{result.card.issuer}</span>
            <span className="text-[#DADCE0] dark:text-[#3C4043]">·</span>
            <span className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">{result.card.pointsCurrency}</span>
            <span className="text-[#DADCE0] dark:text-[#3C4043]">·</span>
            <span className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">{formatCAD(result.card.annualFee)}/yr</span>
            <span className="ml-1">{NETWORK_MARKS[result.card.cardType]}</span>
          </div>
        </div>

        {/* Hero stat */}
        <div className="shrink-0 text-right">
          <p className={`text-[28px] font-bold leading-none tracking-tight ${
            isPositive
              ? "text-black dark:text-[#E8EAED]"
              : "text-[#5F6368] dark:text-[#5F6368]"
          }`}>
            {isPositive ? "+" : ""}{formatCAD(result.netAnnualValue)}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">net / year</p>
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

      {/* Category breakdown (progress bars) */}
      {result.breakdown.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-[12px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
              Category breakdown
            </span>
            <span
              className={`text-[#9AA0A6] transition-transform duration-200 dark:text-[#5F6368] ${open ? "rotate-180" : ""}`}
              aria-hidden
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>

          {open && (
            <div className="mt-3 space-y-2.5">
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
                  {/* Progress bar */}
                  <div className="h-1 w-full overflow-hidden rounded-full bg-[#DADCE0] dark:bg-[#3C4043]">
                    <div
                      className="h-full rounded-full bg-black transition-all duration-500 dark:bg-[#E8EAED]"
                      style={{ width: `${Math.round((b.valueCAD / maxValue) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── List ───────────────────────────────────────────────────────────────── */

export default function CardResults({ results, isCalculating = false }: CardResultsProps) {
  if (results.length === 0 && !isCalculating) return null;

  return (
    <div className="relative space-y-3">
      {/* Loading overlay */}
      {isCalculating && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/85 backdrop-blur-sm dark:bg-[#202124]/85">
          <div className="h-5 w-5 animate-spin rounded-full border-[1.5px] border-[#DADCE0] border-t-black dark:border-[#3C4043] dark:border-t-[#E8EAED]" />
          <p className="text-[13px] font-medium text-[#5F6368] dark:text-[#9AA0A6]">
            Optimizing for your spend…
          </p>
        </div>
      )}

      <div className={isCalculating ? "pointer-events-none select-none opacity-30" : ""}>
        <p className="mb-4 text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
          Ranked by net annual value
        </p>
        {results.map((result, i) => (
          <div key={result.card.id} className={i > 0 ? "mt-3" : ""}>
            <ResultCard result={result} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
