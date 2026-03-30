"use client";

import { useState } from "react";
import { Search } from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface BenefitSelection {
  noForeignFee:   boolean;
  airportLounge:  boolean;
  priorityTravel: boolean;
  freeCheckedBag: boolean;
}

interface BenefitOption {
  key: keyof BenefitSelection;
  label: string;
  sublabel: string;
  keywords: string[];
}

interface BenefitsModuleProps {
  onChange: (benefits: BenefitSelection) => void;
  initialBenefits?: Partial<BenefitSelection>;
}

/* ── Benefit option config ──────────────────────────────────────────────── */

const BENEFIT_OPTIONS: BenefitOption[] = [
  {
    key: "noForeignFee",
    label: "No Foreign Transaction Fees",
    sublabel: "Save the standard 2.5% surcharge on all non-CAD purchases",
    keywords: ["foreign", "fx", "transaction", "fee", "international", "currency", "usd", "abroad"],
  },
  {
    key: "airportLounge",
    label: "Airport Lounge Access",
    sublabel: "Priority Pass, Dragon Pass, Plaza Premium, or proprietary lounge access",
    keywords: ["lounge", "airport", "priority pass", "dragon pass", "plaza premium", "vip"],
  },
  {
    key: "priorityTravel",
    label: "Priority Travel Perks",
    sublabel: "Travel credits, NEXUS reimbursement, concierge, expedited security",
    keywords: ["priority", "travel", "concierge", "security", "nexus", "credit", "global entry"],
  },
  {
    key: "freeCheckedBag",
    label: "Free First Checked Bag",
    sublabel: "Complimentary checked baggage on flights with select partners (e.g. Air Canada)",
    keywords: ["bag", "baggage", "checked", "luggage", "airline", "air canada", "flight"],
  },
];

/* ── BenefitsModule ─────────────────────────────────────────────────────── */

export default function BenefitsModule({
  onChange,
  initialBenefits = {},
}: BenefitsModuleProps) {
  const [benefits, setBenefits] = useState<BenefitSelection>({
    noForeignFee:   initialBenefits.noForeignFee   ?? false,
    airportLounge:  initialBenefits.airportLounge  ?? false,
    priorityTravel: initialBenefits.priorityTravel ?? false,
    freeCheckedBag: initialBenefits.freeCheckedBag ?? false,
  });

  const [query, setQuery] = useState("");

  function update(next: BenefitSelection) {
    setBenefits(next);
    onChange(next);
  }

  function toggleBenefit(key: keyof BenefitSelection) {
    update({ ...benefits, [key]: !benefits[key] });
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? BENEFIT_OPTIONS.filter(
        (b) =>
          b.label.toLowerCase().includes(q) ||
          b.keywords.some((k) => k.includes(q))
      )
    : BENEFIT_OPTIONS;

  const selectedCount = Object.values(benefits).filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-[#DADCE0] bg-white p-6 dark:border-[#3C4043] dark:bg-[#292A2D]">
      {/* Header */}
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-black dark:text-[#E8EAED]">
            Benefits
          </h2>
          <p className="mt-0.5 text-[12px] text-[#9AA0A6] dark:text-[#5F6368]">
            Filter for cards that include the perks you need
          </p>
        </div>
        {selectedCount > 0 && (
          <span className="shrink-0 rounded-full bg-black px-2.5 py-0.5 text-[11px] font-semibold text-white dark:bg-[#E8EAED] dark:text-[#202124]">
            {selectedCount}
          </span>
        )}
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[#9AA0A6] dark:text-[#5F6368]">
          <Search size={14} />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search benefits…"
          className="w-full rounded-xl border border-[#DADCE0] bg-[#F8F9FA] py-2.5 pl-9 pr-4 text-[13px] text-black placeholder:text-[#BDC1C6] transition-all duration-150 focus:border-black focus:bg-white focus:outline-none dark:border-[#3C4043] dark:bg-[#202124] dark:text-[#E8EAED] dark:placeholder:text-[#5F6368] dark:focus:border-[#E8EAED] dark:focus:bg-[#292A2D]"
        />
      </div>

      {/* Options list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-[13px] text-[#9AA0A6] dark:text-[#5F6368]">
            No benefits match &ldquo;{query}&rdquo;
          </p>
        )}

        {filtered.map((opt) => {
          const isSelected = benefits[opt.key];
          return (
            <div
              key={opt.key}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => toggleBenefit(opt.key)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  toggleBenefit(opt.key);
                }
              }}
              className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-colors duration-150 ${
                isSelected
                  ? "border-black bg-black/[0.03] dark:border-[#E8EAED] dark:bg-[#E8EAED]/[0.05]"
                  : "border-[#DADCE0] hover:border-[#BDC1C6] dark:border-[#3C4043] dark:hover:border-[#5F6368]"
              }`}
            >
              {/* Custom checkbox indicator */}
              <div
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-150 ${
                  isSelected
                    ? "border-black bg-black dark:border-[#E8EAED] dark:bg-[#E8EAED]"
                    : "border-[#DADCE0] bg-white dark:border-[#5F6368] dark:bg-[#292A2D]"
                }`}
              >
                {isSelected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="dark:stroke-[#202124]"
                    />
                  </svg>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-black dark:text-[#E8EAED]">
                  {opt.label}
                </p>
                <p className="mt-0.5 text-[11px] text-[#9AA0A6] dark:text-[#5F6368]">
                  {opt.sublabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
