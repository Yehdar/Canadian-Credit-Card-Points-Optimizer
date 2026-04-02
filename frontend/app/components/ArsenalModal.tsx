"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import type { RecommendationResult, SavedCard } from "@/lib/api";
import type { ArsenalCard } from "@/hooks/useChat";
import { VisaMark, MastercardMark, AmexMark } from "./NetworkMarks";

// ThreeDCard uses WebGL — must be dynamically imported with SSR disabled.
const ThreeDCard = dynamic(() => import("./ThreeDCard"), { ssr: false });

// Per-card color overrides — takes priority over the cardType default.
const CARD_COLOR_OVERRIDES: Record<string, string> = {
  "Wealthsimple Cash Visa Prepaid": "#111111",
  "Amex Platinum":                  "#C8C8C8",
};

interface ArsenalModalProps {
  results: RecommendationResult[];
  arsenalCards: ArsenalCard[];
  onClose: () => void;
  onDevSkip?: () => void;
  activeProfileName: string | null;
  onSaveCards: (() => void) | null;
}

const NETWORK_MARKS: Record<string, React.ReactNode> = {
  visa:       <VisaMark className="h-4" />,
  mastercard: <MastercardMark className="h-5" />,
  amex:       <AmexMark className="h-4" />,
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

function formatCADDecimal(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// A card portrait for the bottom tray.
function CardPortrait({
  result,
  isActive,
  onClick,
}: {
  result: RecommendationResult;
  isActive: boolean;
  onClick: () => void;
}) {
  const isPositive = result.netAnnualValue >= 0;
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 flex-col gap-1.5 rounded-xl border p-3 text-left transition-all duration-150 ${
        isActive
          ? "border-black bg-[#F1F3F4] dark:border-[#E8EAED] dark:bg-[#292A2D]"
          : "border-[#DADCE0] bg-white hover:bg-[#F8F9FA] dark:border-[#3C4043] dark:bg-[#202124] dark:hover:bg-[#292A2D]"
      }`}
      style={{ minWidth: "148px" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-[#5F6368] dark:text-[#9AA0A6]">
          {result.card.issuer}
        </span>
        <span className="shrink-0">{NETWORK_MARKS[result.card.cardType]}</span>
      </div>
      <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-[#202124] dark:text-[#E8EAED]">
        {result.card.name}
      </p>
      <p className={`mt-auto text-[12px] font-bold ${isPositive ? "text-[#202124] dark:text-[#E8EAED]" : "text-[#5F6368] dark:text-[#9AA0A6]"}`}>
        {isPositive ? "+" : ""}{formatCAD(result.netAnnualValue)}/yr
      </p>
    </button>
  );
}

export default function ArsenalModal({ results, arsenalCards, onClose, onDevSkip, activeProfileName, onSaveCards }: ArsenalModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [saveDismissed, setSaveDismissed] = useState(false);

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

  function handleSave() {
    if (!onSaveCards) return;
    onSaveCards();
    setSaveState("saved");
    setTimeout(() => { setSaveState("idle"); setSaveDismissed(true); }, 2000);
  }

  const selected = results[selectedIndex];
  const aiCard = arsenalCards.find(c => c.name === selected?.card.name);
  const isPositive = (selected?.netAnnualValue ?? 0) >= 0;
  const maxValue = Math.max(...(selected?.breakdown.map(b => b.valueCAD) ?? [0.01]), 0.01);

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#DADCE0] bg-white shadow-2xl dark:border-[#3C4043] dark:bg-[#202124]"
        style={{ height: "85vh" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#DADCE0] bg-white px-6 py-4 dark:border-[#3C4043] dark:bg-[#292A2D]">
          <div>
            <h2 className="text-[17px] font-bold tracking-tight text-[#202124] dark:text-[#E8EAED]">
              Your Card Arsenal
            </h2>
            <p className="mt-0.5 text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">
              {results.length} card{results.length !== 1 ? "s" : ""} · ranked by net annual value
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

        {/* ── Main: 3D card stage + data panel ────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">

          {/* Left: 3D card stage */}
          <div className="relative flex shrink-0 items-center justify-center bg-[#F8F9FA] dark:bg-[#202124] lg:w-[42%]">
            {/* Soft vignette */}
            <div className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.06) 100%)" }} />
            {/* Floor line */}
            <div className="pointer-events-none absolute bottom-8 left-1/2 h-[1px] w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#DADCE0] to-transparent dark:via-[#3C4043]" />

            <div className="h-52 w-full max-w-[280px] lg:h-64">
              {selected && (
                <ThreeDCard
                  cardType={selected.card.cardType as "visa" | "mastercard" | "amex"}
                  cardName={selected.card.name}
                  issuer={selected.card.issuer}
                  color={aiCard?.visualConfig?.baseColor ?? CARD_COLOR_OVERRIDES[selected.card.name]}
                  visualConfig={aiCard?.visualConfig}
                />
              )}
            </div>
          </div>

          {/* Right: data panel */}
          <div className="flex-1 overflow-y-auto border-t border-[#DADCE0] bg-white/60 backdrop-blur-sm dark:border-[#3C4043] dark:bg-[#292A2D]/60 lg:border-l lg:border-t-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedIndex}
                className="flex flex-col gap-5 px-6 py-6"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {selected && (
                  <>
                    {/* Card identity */}
                    <div>
                      {aiCard?.purpose && (
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#5F6368] dark:text-[#9AA0A6]">
                          {aiCard.purpose}
                        </p>
                      )}
                      <h3 className="text-[22px] font-black leading-tight tracking-tight text-[#202124] dark:text-[#E8EAED]">
                        {selected.card.name}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">{selected.card.issuer}</span>
                        <span className="text-[#DADCE0] dark:text-[#3C4043]">·</span>
                        <span className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">{selected.card.pointsCurrency}</span>
                        <span className="text-[#DADCE0] dark:text-[#3C4043]">·</span>
                        <span className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">{formatCADDecimal(selected.card.annualFee)}/yr</span>
                        <span className="ml-1">{NETWORK_MARKS[selected.card.cardType]}</span>
                      </div>
                    </div>

                    {/* Gemini description */}
                    {aiCard?.description && (
                      <div className="flex items-start gap-3 rounded-xl border border-[#E8F0FE] bg-[#F0F4FF] px-4 py-3 dark:border-[#1A3A6B] dark:bg-[#1A2A4A]">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1A73E8] text-[9px] font-bold text-white">
                          CG
                        </div>
                        <p className="text-[12px] leading-relaxed text-[#1A73E8] dark:text-[#7BAAF7]">
                          {aiCard.description}
                        </p>
                      </div>
                    )}

                    {/* Eligibility warning */}
                    {selected.eligibilityWarning && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/30">
                        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" viewBox="0 0 16 16" fill="none" aria-hidden>
                          <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
                          <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                          <circle cx="8" cy="11.5" r="0.625" fill="currentColor"/>
                        </svg>
                        <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                          {selected.eligibilityWarning}
                        </p>
                      </div>
                    )}

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-[#DADCE0] bg-[#DADCE0] dark:border-[#3C4043] dark:bg-[#3C4043]">
                      <div className="bg-[#F1F3F4] px-4 py-3 dark:bg-[#202124]">
                        <p className="text-[10px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">Net / Year</p>
                        <p className={`mt-0.5 text-[16px] font-bold ${isPositive ? "text-[#202124] dark:text-[#E8EAED]" : "text-[#5F6368]"}`}>
                          {isPositive ? "+" : ""}{formatCAD(selected.netAnnualValue)}
                        </p>
                      </div>
                      <div className="bg-[#F1F3F4] px-4 py-3 dark:bg-[#202124]">
                        <p className="text-[10px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">Rewards Value</p>
                        <p className="mt-0.5 text-[16px] font-bold text-[#202124] dark:text-[#E8EAED]">
                          {formatCAD(selected.totalValueCAD)}
                        </p>
                      </div>
                      <div className="bg-[#F1F3F4] px-4 py-3 dark:bg-[#202124]">
                        <p className="text-[10px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">Points</p>
                        <p className="mt-0.5 text-[16px] font-bold text-[#202124] dark:text-[#E8EAED]">
                          {selected.totalPointsEarned > 0
                            ? selected.totalPointsEarned.toLocaleString("en-CA")
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Category breakdown */}
                    {selected.breakdown.length > 0 && (
                      <div>
                        <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
                          Category breakdown
                        </p>
                        <div className="space-y-2.5">
                          {selected.breakdown.map((b) => (
                            <div key={b.category}>
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">
                                  {CATEGORY_LABELS[b.category] ?? b.category}
                                </span>
                                <span className="text-[12px] font-medium text-[#202124] dark:text-[#E8EAED]">
                                  {formatCADDecimal(b.valueCAD)}
                                </span>
                              </div>
                              <div className="h-1 w-full overflow-hidden rounded-full bg-[#DADCE0] dark:bg-[#3C4043]">
                                <motion.div
                                  className="h-full rounded-full bg-[#202124] dark:bg-[#E8EAED]"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.round((b.valueCAD / maxValue) * 100)}%` }}
                                  transition={{ duration: 0.45, ease: "easeOut" }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Bottom card tray ────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-[#DADCE0] bg-white px-6 py-4 dark:border-[#3C4043] dark:bg-[#292A2D]">
          <p className="mb-2.5 text-[10px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
            Your Arsenal
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
            {results.map((result, i) => (
              <CardPortrait
                key={result.card.id}
                result={result}
                isActive={i === selectedIndex}
                onClick={() => setSelectedIndex(i)}
              />
            ))}
          </div>
        </div>

        {/* ── Footer: save prompt + exit strategy ─────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-[#DADCE0] bg-[#F8F9FA] px-6 py-4 dark:border-[#3C4043] dark:bg-[#202124]">

          {/* Left: save prompt when a profile is active, otherwise original text */}
          <div className="flex items-center gap-2">
            {activeProfileName && !saveDismissed && onSaveCards ? (
              saveState === "saved" ? (
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#1E8E3E] dark:text-[#81C995]">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                    <path d="M2 6.5L5.5 10L11 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Saved!
                </span>
              ) : (
                <>
                  <span className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">
                    Save {results.length} card{results.length !== 1 ? "s" : ""} to &lsquo;{activeProfileName}&rsquo;?
                  </span>
                  <button
                    onClick={handleSave}
                    className="rounded-lg bg-[#202124] px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-[#3C4043] dark:bg-[#E8EAED] dark:text-[#202124] dark:hover:bg-[#BDC1C6]"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setSaveDismissed(true)}
                    aria-label="Dismiss save prompt"
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[#9AA0A6] transition hover:bg-[#DADCE0] dark:hover:bg-[#3C4043]"
                  >
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
                      <path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </>
              )
            ) : (
              <p className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">
                Want to keep chatting to fine-tune this arsenal?
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="shrink-0 rounded-lg border border-[#DADCE0] bg-white px-4 py-2 text-[13px] font-medium text-[#202124] transition hover:bg-[#F1F3F4] dark:border-[#3C4043] dark:bg-[#292A2D] dark:text-[#E8EAED] dark:hover:bg-[#3C4043]"
          >
            Back to Chat →
          </button>
        </div>
      </motion.div>

      {/* Dev skip button */}
      {process.env.NODE_ENV === "development" && onDevSkip && (
        <button
          onClick={onDevSkip}
          className="fixed bottom-4 left-4 z-[70] rounded-lg border border-[#DADCE0] bg-white px-3 py-1.5 text-xs font-medium text-[#5F6368] shadow-sm transition hover:bg-[#F1F3F4] dark:border-[#3C4043] dark:bg-[#292A2D] dark:text-[#9AA0A6] dark:hover:bg-[#3C4043]"
        >
          ⚡ dev: reload mock
        </button>
      )}
    </div>
  );
}
