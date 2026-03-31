"use client";

import type { RecommendationResult } from "@/lib/api";
import { VisaMark, MastercardMark, AmexMark } from "./NetworkMarks";

interface ActiveArsenalBannerProps {
  cards: RecommendationResult[];
  onClick: () => void;
}

const NETWORK_MARKS: Record<string, React.ReactNode> = {
  visa:       <VisaMark className="h-3 w-auto" />,
  mastercard: <MastercardMark className="h-4 w-auto" />,
  amex:       <AmexMark className="h-3 w-auto" />,
};

function CardPill({ result }: { result: RecommendationResult }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-[#DADCE0] bg-white px-2.5 py-1 dark:border-[#3C4043] dark:bg-[#2D2E30]">
      <span className="flex items-center">{NETWORK_MARKS[result.card.cardType]}</span>
      <span className="max-w-[120px] truncate text-[11px] font-medium text-[#202124] dark:text-[#E8EAED]">
        {result.card.name}
      </span>
    </span>
  );
}

export default function ActiveArsenalBanner({ cards, onClick }: ActiveArsenalBannerProps) {
  if (cards.length === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="sticky top-0 z-10 -mx-6 mb-4 flex w-[calc(100%+3rem)] cursor-pointer items-center gap-3 border-b border-[#DADCE0] bg-[#F8F9FA]/95 px-6 py-2.5 backdrop-blur-sm transition hover:bg-[#F1F3F4] dark:border-[#3C4043] dark:bg-[#202124]/95 dark:hover:bg-[#2D2E30]"
      aria-label="View your card arsenal"
    >
      {/* Label */}
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
        Arsenal
      </span>

      {/* Card pills */}
      <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
        {cards.map((r) => (
          <CardPill key={r.card.id} result={r} />
        ))}
      </div>

      {/* Chevron */}
      <span className="shrink-0 text-[#9AA0A6] dark:text-[#5F6368]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}
