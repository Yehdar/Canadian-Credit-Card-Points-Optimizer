"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import type { RecommendationResult } from "@/lib/api";
import type { ArsenalCard } from "@/hooks/useChat";
import { VisaMark, MastercardMark, AmexMark } from "./NetworkMarks";

// ThreeDCard uses WebGL — must be dynamically imported with SSR disabled.
const ThreeDCard = dynamic(() => import("./ThreeDCard"), { ssr: false });

interface ArsenalModalProps {
  results: RecommendationResult[];
  arsenalCards: ArsenalCard[];
  onClose: () => void;
  onDevSkip?: () => void;
}

const NETWORK_MARKS: Record<string, React.ReactNode> = {
  visa:       <VisaMark className="h-5" />,
  mastercard: <MastercardMark className="h-5" />,
  amex:       <AmexMark className="h-5" />,
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

// Scanline overlay for the data panel.
function ScanlineOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-r-2xl">
      {/* Static horizontal scanlines */}
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(0,255,212,0.018) 3px,
            rgba(0,255,212,0.018) 4px
          )`,
        }}
      />
      {/* Moving scan line */}
      <motion.div
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
        animate={{ y: ["0%", "100vh"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
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
      className={`flex shrink-0 flex-col gap-1 rounded-xl border p-3 text-left transition-all duration-200 ${
        isActive
          ? "border-cyan-400 bg-cyan-950/40 shadow-[0_0_12px_rgba(0,255,212,0.2)]"
          : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
      }`}
      style={{ minWidth: "140px" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-bold uppercase tracking-widest text-cyan-400/70">
          {result.card.issuer}
        </span>
        <span className="shrink-0">{NETWORK_MARKS[result.card.cardType]}</span>
      </div>
      <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-[#ECE8E1]">
        {result.card.name}
      </p>
      <p className={`mt-auto text-[13px] font-bold ${isPositive ? "text-cyan-400" : "text-[#9AA0A6]"}`}>
        {isPositive ? "+" : ""}{formatCAD(result.netAnnualValue)}/yr
      </p>
    </button>
  );
}

export default function ArsenalModal({ results, arsenalCards, onClose, onDevSkip }: ArsenalModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  const selected = results[selectedIndex];
  const aiCard = arsenalCards.find(c => c.name === selected?.card.name);
  const isPositive = (selected?.netAnnualValue ?? 0) >= 0;
  const maxValue = Math.max(...(selected?.breakdown.map(b => b.valueCAD) ?? [0.01]), 0.01);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #0D2A3A 0%, #050810 70%)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="relative flex h-full w-full flex-col"
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* ── Header bar ─────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-[2px] w-8 bg-cyan-400" />
            <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              Card Arsenal
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-widest text-white/30">
              {results.length} card{results.length !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={onClose}
              aria-label="Close arsenal"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 transition hover:border-white/30 hover:text-white/80"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Main area: 3D card + data panel ────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">

          {/* Left: 3D Card stage */}
          <div className="relative flex shrink-0 items-center justify-center bg-transparent lg:w-[45%]">
            {/* Podium glow */}
            <div
              className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 blur-3xl"
              style={{
                width: "60%",
                height: "40%",
                background: "radial-gradient(ellipse, rgba(0,255,212,0.18) 0%, transparent 70%)",
              }}
            />
            {/* Floor line */}
            <div className="pointer-events-none absolute bottom-8 left-1/2 h-[1px] w-[55%] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

            <div className="h-56 w-full max-w-xs lg:h-72">
              {selected && (
                <ThreeDCard
                  cardType={selected.card.cardType as "visa" | "mastercard" | "amex"}
                  cardName={selected.card.name}
                  issuer={selected.card.issuer}
                />
              )}
            </div>
          </div>

          {/* Right: Data panel */}
          <div className="relative flex-1 overflow-y-auto border-t border-white/10 lg:border-l lg:border-t-0">
            <ScanlineOverlay />

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedIndex}
                className="relative z-10 flex h-full flex-col gap-6 px-8 py-8"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {selected && (
                  <>
                    {/* Card identity */}
                    <div>
                      {aiCard?.purpose && (
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                          {aiCard.purpose}
                        </p>
                      )}
                      <h3 className="text-[26px] font-black leading-none tracking-tight text-[#ECE8E1]">
                        {selected.card.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-[12px] text-white/50">{selected.card.issuer}</span>
                        <span className="text-white/20">·</span>
                        <span className="text-[12px] text-white/50">{selected.card.pointsCurrency}</span>
                        <span className="text-white/20">·</span>
                        <span className="text-[12px] text-white/50">{formatCADDecimal(selected.card.annualFee)}/yr fee</span>
                        <span className="ml-1">{NETWORK_MARKS[selected.card.cardType]}</span>
                      </div>
                    </div>

                    {/* Gemini description */}
                    {aiCard?.description && (
                      <div className="rounded-xl border border-cyan-400/20 bg-cyan-950/30 px-4 py-3">
                        <div className="mb-1.5 flex items-center gap-2">
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[8px] font-black text-[#050810]">
                            CG
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/70">CardGenius</span>
                        </div>
                        <p className="text-[13px] leading-relaxed text-cyan-100/80">
                          {aiCard.description}
                        </p>
                      </div>
                    )}

                    {/* Eligibility warning */}
                    {selected.eligibilityWarning && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-950/30 px-4 py-3">
                        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" viewBox="0 0 16 16" fill="none" aria-hidden>
                          <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
                          <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                          <circle cx="8" cy="11.5" r="0.625" fill="currentColor"/>
                        </svg>
                        <p className="text-[11px] leading-relaxed text-amber-300/80">
                          {selected.eligibilityWarning}
                        </p>
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Net / Year</p>
                        <p className={`mt-1 text-[20px] font-black leading-none ${isPositive ? "text-cyan-400" : "text-white/50"}`}>
                          {isPositive ? "+" : ""}{formatCAD(selected.netAnnualValue)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Rewards Value</p>
                        <p className="mt-1 text-[20px] font-black leading-none text-[#ECE8E1]">
                          {formatCAD(selected.totalValueCAD)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Points</p>
                        <p className="mt-1 text-[20px] font-black leading-none text-[#ECE8E1]">
                          {selected.totalPointsEarned > 0
                            ? selected.totalPointsEarned.toLocaleString("en-CA")
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Category breakdown */}
                    {selected.breakdown.length > 0 && (
                      <div>
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                          Category Breakdown
                        </p>
                        <div className="space-y-2.5">
                          {selected.breakdown.map((b) => (
                            <div key={b.category}>
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-[12px] text-white/50">
                                  {CATEGORY_LABELS[b.category] ?? b.category}
                                </span>
                                <span className="text-[12px] font-semibold text-[#ECE8E1]">
                                  {formatCADDecimal(b.valueCAD)}
                                </span>
                              </div>
                              <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
                                <motion.div
                                  className="h-full rounded-full bg-cyan-400"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.round((b.valueCAD / maxValue) * 100)}%` }}
                                  transition={{ duration: 0.5, ease: "easeOut" }}
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

        {/* ── Bottom card tray ───────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-white/10 px-6 py-4">
          <div className="mb-2 flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Your Arsenal</p>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
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
      </motion.div>

      {/* Dev skip button inside modal */}
      {process.env.NODE_ENV === "development" && onDevSkip && (
        <button
          onClick={onDevSkip}
          className="fixed bottom-4 left-4 z-[70] rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black shadow-lg transition hover:bg-yellow-300"
        >
          DEV ⚡ Reload Mock
        </button>
      )}
    </motion.div>
  );
}
