"use client";

import { useState } from "react";
import type { RecommendationResult } from "@/lib/api";

interface CardResultsProps {
  results: RecommendationResult[];
  isCalculating?: boolean;
}

/* ── Network mark SVGs (monochromatic) ─────────────────────────────────── */

function VisaMark() {
  return (
    <svg viewBox="0 0 48 16" className="h-4 w-auto" aria-label="Visa">
      <text
        x="0" y="13"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fontStyle="italic"
        fontSize="16"
        fill="#1A1A6E"
        letterSpacing="-0.5"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardMark() {
  return (
    <svg viewBox="0 0 38 24" className="h-5 w-auto" aria-label="Mastercard">
      <circle cx="14" cy="12" r="10" fill="#EB001B" />
      <circle cx="24" cy="12" r="10" fill="#F79E1B" />
      <path
        d="M19 5.5a10 10 0 0 1 0 13A10 10 0 0 1 19 5.5z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function AmexMark() {
  return (
    <svg viewBox="0 0 48 16" className="h-4 w-auto" aria-label="Amex">
      <text
        x="0" y="13"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fontSize="13"
        fill="#007BC1"
        letterSpacing="1.5"
      >
        AMEX
      </text>
    </svg>
  );
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
      className={`group rounded-2xl bg-white p-6 transition-all duration-200 ${
        isBest
          ? "border border-black"
          : "border border-[#EBEBEB] hover:border-[#C8C8C8]"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Rank + badge */}
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-widest text-[#A8A8A8]">
              #{index + 1}
            </span>
            {isBest && (
              <span className="rounded-full bg-black px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">
                Best Match
              </span>
            )}
          </div>

          {/* Card name */}
          <h3 className="text-[17px] font-semibold leading-tight tracking-tight text-black">
            {result.card.name}
          </h3>

          {/* Meta row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[12px] text-[#6B6B6B]">{result.card.issuer}</span>
            <span className="text-[#EBEBEB]">·</span>
            <span className="text-[12px] text-[#6B6B6B]">{result.card.pointsCurrency}</span>
            <span className="text-[#EBEBEB]">·</span>
            <span className="text-[12px] text-[#6B6B6B]">{formatCAD(result.card.annualFee)}/yr</span>
            <span className="ml-1">{NETWORK_MARKS[result.card.cardType]}</span>
          </div>
        </div>

        {/* Hero stat */}
        <div className="shrink-0 text-right">
          <p className={`text-[28px] font-bold leading-none tracking-tight ${
            isPositive ? "text-black" : "text-[#6B6B6B]"
          }`}>
            {isPositive ? "+" : ""}{formatCAD(result.netAnnualValue)}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-[#A8A8A8]">net / year</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#EBEBEB] bg-[#EBEBEB]">
        <div className="bg-[#F7F7F7] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#A8A8A8]">
            Rewards value
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-black">
            {formatCAD(result.totalValueCAD)}
          </p>
        </div>
        <div className="bg-[#F7F7F7] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#A8A8A8]">
            Points earned
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-black">
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
            <span className="text-[12px] font-medium uppercase tracking-widest text-[#A8A8A8]">
              Category breakdown
            </span>
            <span
              className={`text-[#A8A8A8] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
                    <span className="text-[12px] text-[#6B6B6B]">
                      {CATEGORY_LABELS[b.category] ?? b.category}
                    </span>
                    <span className="text-[12px] font-medium text-black">
                      {formatCAD(b.valueCAD)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 w-full overflow-hidden rounded-full bg-[#EBEBEB]">
                    <div
                      className="h-full rounded-full bg-black transition-all duration-500"
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
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/85 backdrop-blur-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-[1.5px] border-[#EBEBEB] border-t-black" />
          <p className="text-[13px] font-medium text-[#6B6B6B]">
            Optimizing for your spend…
          </p>
        </div>
      )}

      <div className={isCalculating ? "pointer-events-none select-none opacity-30" : ""}>
        <p className="mb-4 text-[11px] font-medium uppercase tracking-widest text-[#A8A8A8]">
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
