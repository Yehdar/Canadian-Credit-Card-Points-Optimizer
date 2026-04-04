"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Info, Receipt } from "lucide-react";
import type { SavedCard, CategoryBreakdown, ExtractedData } from "@/lib/api";
import { VisaMark, MastercardMark, AmexMark } from "./NetworkMarks";

interface SavedCatalogProps {
  savedCards: SavedCard[];
  onClose: () => void;
  onReSyncCard: (card: SavedCard) => void;
  onViewCard: (card: SavedCard) => void;
  snapshot?: ExtractedData | null;
}

const REWARD_LABELS: Record<string, string> = {
  cashback: "Cash Back",
  points:   "Points / Travel",
  both:     "Both",
};

const FEE_LABELS: Record<string, string> = {
  no_fee:      "No annual fee",
  include_fee: "Open to fees",
};

const SPEND_LABELS: { key: keyof NonNullable<ExtractedData["spending"]>; label: string }[] = [
  { key: "groceries",            label: "Groceries" },
  { key: "dining",               label: "Dining" },
  { key: "gas",                  label: "Gas" },
  { key: "travel",               label: "Travel" },
  { key: "entertainment",        label: "Entertainment" },
  { key: "subscriptions",        label: "Subscriptions" },
  { key: "transit",              label: "Transit" },
  { key: "pharmacy",             label: "Pharmacy" },
  { key: "onlineShopping",       label: "Online Shopping" },
  { key: "homeImprovement",      label: "Home Improvement" },
  { key: "canadianTirePartners", label: "Canadian Tire Partners" },
  { key: "foreignPurchases",     label: "Foreign Purchases" },
  { key: "other",                label: "Other" },
];

const NETWORK_MARKS: Record<string, React.ReactNode> = {
  visa:       <VisaMark className="h-4 opacity-80" />,
  mastercard: <MastercardMark className="h-5 opacity-80" />,
  amex:       <AmexMark className="h-4 opacity-80" />,
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function topSpendCategories(breakdown: CategoryBreakdown[]): CategoryBreakdown[] {
  return [...breakdown].sort((a, b) => b.spent - a.spent).slice(0, 2);
}

function CardTile({
  card,
  onView,
}: {
  card: SavedCard;
  onView: () => void;
}) {
  const baseColor = card.visualConfig?.baseColor ?? "#333333";
  const isPositive = card.netAnnualValue >= 0;
  const top2 = topSpendCategories(card.breakdown ?? []);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[#DADCE0] shadow-sm dark:border-[#3C4043]">
      {/* Card face — credit card aspect ratio 1.586:1 */}
      <div
        className="relative flex flex-col justify-between p-4"
        style={{
          backgroundColor: baseColor,
          aspectRatio: "1.586 / 1",
        }}
      >
        {/* Gradient overlay for text readability */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.35) 100%)" }}
        />

        {/* Top row: issuer + purpose + network mark */}
        <div className="relative flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/70 truncate">
              {card.issuer}
            </p>
            {card.purpose && (
              <p className="mt-0.5 text-[9px] font-medium text-white/60 line-clamp-1">
                {card.purpose}
              </p>
            )}
          </div>
          <span className="shrink-0">{NETWORK_MARKS[card.cardType] ?? null}</span>
        </div>

        {/* Bottom: card name + value */}
        <div className="relative">
          <p className="text-[12px] font-bold leading-tight text-white line-clamp-2">
            {card.name}
          </p>
          <p className={`mt-1 text-[11px] font-bold ${isPositive ? "text-white" : "text-white/60"}`}>
            {isPositive ? "+" : ""}{formatCAD(card.netAnnualValue)}/yr
          </p>
        </div>
      </div>

      {/* Metadata + actions */}
      <div className="flex flex-1 flex-col gap-2.5 bg-white px-3.5 py-3 dark:bg-[#2D2E30]">
        {top2.length > 0 && (
          <p className="text-[10px] leading-snug text-[#5F6368] dark:text-[#9AA0A6] line-clamp-1">
            {top2.map(b => `${CATEGORY_LABELS[b.category] ?? b.category} ${formatCAD(b.spent / 12)}`).join(" · ")}/mo
          </p>
        )}
        <button
          onClick={onView}
          className="w-full rounded-lg border border-[#DADCE0] bg-white px-2 py-1.5 text-[11px] font-medium text-[#202124] transition hover:bg-[#F1F3F4] dark:border-[#3C4043] dark:bg-[#292A2D] dark:text-[#E8EAED] dark:hover:bg-[#3C4043]"
        >
          View
        </button>
      </div>
    </div>
  );
}

export default function SavedCatalog({ savedCards, onClose, onReSyncCard, onViewCard, snapshot }: SavedCatalogProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const profileBtnRef = useRef<HTMLButtonElement>(null);
  const [profilePos, setProfilePos] = useState<{ top: number; left: number; maxHeight: string } | null>(null);

  useEffect(() => {
    if (profileOpen && profileBtnRef.current) {
      const rect = profileBtnRef.current.getBoundingClientRect();
      setProfilePos({
        top: rect.bottom + 6,
        left: rect.left,
        maxHeight: `${window.innerHeight - rect.bottom - 16}px`,
      });
    }
  }, [profileOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#DADCE0] bg-white shadow-2xl dark:border-[#3C4043] dark:bg-[#202124]"
        style={{ maxHeight: "88vh" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#DADCE0] bg-white px-6 py-4 dark:border-[#3C4043] dark:bg-[#292A2D]">
          {/* Left: title */}
          <div className="flex items-center gap-2.5">
            <Bookmark className="h-4 w-4 text-[#1A73E8]" />
            <div>
              <h2 className="text-[17px] font-bold tracking-tight text-[#202124] dark:text-[#E8EAED]">
                Saved Arsenal
              </h2>
              <p className="mt-0.5 text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">
                {savedCards.length} saved card{savedCards.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Right: Re-Sync + info + close */}
          <div className="flex items-center gap-2">
            {savedCards.length > 0 && (
              <>
                {/* Spending Profile — standalone */}
                <div className="relative">
                  <button
                    ref={profileBtnRef}
                    onClick={() => { setProfileOpen(v => !v); setInfoOpen(false); }}
                    className="flex items-center gap-1.5 rounded-lg border border-[#DADCE0] px-3 py-1.5 text-[12px] font-medium text-[#5F6368] transition hover:bg-[#F1F3F4] dark:border-[#3C4043] dark:text-[#9AA0A6] dark:hover:bg-[#3C4043]"
                  >
                    Spending Profile
                    <Receipt className="h-3.5 w-3.5" />
                  </button>
                  {profileOpen && profilePos && (
                    <div
                      className="fixed z-[9999] w-64 overflow-y-auto rounded-xl border border-[#DADCE0] bg-white px-4 py-3 shadow-lg dark:border-[#3C4043] dark:bg-[#292A2D]"
                      style={{ top: profilePos.top, left: profilePos.left, maxHeight: profilePos.maxHeight }}
                    >
                      {/* Spending */}
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">Monthly Spending</p>
                      <div className="space-y-1">
                        {SPEND_LABELS.map(({ key, label }) => {
                          const val = snapshot?.spending?.[key] ?? null;
                          return (
                            <p key={key} className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">
                              <span className="font-semibold text-[#202124] dark:text-[#E8EAED]">{label}:</span>{" "}
                              {val !== null ? formatCAD(val) : "$0"}/mo
                            </p>
                          );
                        })}
                      </div>

                      {/* Financial Profile */}
                      <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">Financial Profile</p>
                      <div className="space-y-1">
                        <p className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">
                          <span className="font-semibold text-[#202124] dark:text-[#E8EAED]">Personal income:</span>{" "}
                          {snapshot?.annualIncome != null ? formatCAD(snapshot.annualIncome) + "/yr" : "—"}
                        </p>
                        <p className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">
                          <span className="font-semibold text-[#202124] dark:text-[#E8EAED]">Household income:</span>{" "}
                          {snapshot?.householdIncome != null ? formatCAD(snapshot.householdIncome) + "/yr" : "—"}
                        </p>
                        <p className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">
                          <span className="font-semibold text-[#202124] dark:text-[#E8EAED]">Credit score:</span>{" "}
                          {snapshot?.estimatedCreditScore ?? "—"}
                        </p>
                      </div>

                      {/* Preferences */}
                      <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">Preferences</p>
                      <div className="space-y-1">
                        <p className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">
                          <span className="font-semibold text-[#202124] dark:text-[#E8EAED]">Reward type:</span>{" "}
                          {snapshot?.filters?.rewardType ? (REWARD_LABELS[snapshot.filters.rewardType] ?? snapshot.filters.rewardType) : "—"}
                        </p>
                        <p className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">
                          <span className="font-semibold text-[#202124] dark:text-[#E8EAED]">Annual fee:</span>{" "}
                          {snapshot?.filters?.feePreference ? (FEE_LABELS[snapshot.filters.feePreference] ?? snapshot.filters.feePreference) : "—"}
                        </p>
                        <p className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">
                          <span className="font-semibold text-[#202124] dark:text-[#E8EAED]">Networks:</span>{" "}
                          {snapshot?.filters?.networks?.length
                            ? snapshot.filters.networks.map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(", ")
                            : "—"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Re-Sync + Info — connected group */}
                <div className="relative flex mr-2">
                  <button
                    onClick={() => { onReSyncCard(savedCards[0]); onClose(); }}
                    className="flex items-center gap-1.5 rounded-l-lg border border-r-0 border-[#1A73E8]/30 bg-[#E8F0FE] px-3 py-1.5 text-[12px] font-medium text-[#1A73E8] transition hover:bg-[#D2E3FC] dark:border-[#1A73E8]/40 dark:bg-[#1A3A6B]/40 dark:text-[#7BAAF7] dark:hover:bg-[#1A3A6B]/60"
                  >
                    Re-Sync
                  </button>
                <button
                  onClick={() => setInfoOpen(v => !v)}
                  aria-label="What is Re-Sync?"
                  className="flex items-center justify-center rounded-r-lg border border-[#1A73E8]/30 bg-[#E8F0FE] px-2 py-1.5 text-[#1A73E8] transition hover:bg-[#D2E3FC] dark:border-[#1A73E8]/40 dark:bg-[#1A3A6B]/40 dark:text-[#7BAAF7] dark:hover:bg-[#1A3A6B]/60"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
                {infoOpen && (
                  <div className="absolute right-0 top-[calc(100%+6px)] z-10 w-64 rounded-xl border border-[#DADCE0] bg-white px-4 py-3 shadow-lg dark:border-[#3C4043] dark:bg-[#292A2D]">
                    <p className="text-[12px] leading-relaxed text-[#5F6368] dark:text-[#9AA0A6]">
                      Re-Sync answers &ldquo;given this same spending profile, what would Gemini recommend today?&rdquo;
                    </p>
                  </div>
                )}
                </div>
              </>
            )}

            <button
              onClick={onClose}
              aria-label="Close saved catalog"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#5F6368] transition hover:bg-[#F1F3F4] dark:text-[#9AA0A6] dark:hover:bg-[#3C4043]"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-6">
          {savedCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Bookmark className="mb-3 h-8 w-8 text-[#DADCE0] dark:text-[#3C4043]" />
              <p className="text-[14px] font-medium text-[#5F6368] dark:text-[#9AA0A6]">No saved cards yet</p>
              <p className="mt-1 text-[12px] text-[#9AA0A6] dark:text-[#5F6368]">
                Save a card arsenal from the optimizer to see it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedCards.map((card) => (
                <CardTile
                  key={card.name}
                  card={card}
                  onView={() => onViewCard(card)}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
