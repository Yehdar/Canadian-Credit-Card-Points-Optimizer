"use client";

import { useState } from "react";
import type { CardNetwork } from "@/lib/api";
import { VisaMark, MastercardMark, AmexMark } from "./NetworkMarks";

interface NetworkModuleProps {
  onChange: (networks: CardNetwork[]) => void;
  initialSelected?: CardNetwork[];
}

/* ── Network config ─────────────────────────────────────────────────────── */

const NETWORKS: {
  id: CardNetwork;
  label: string;
  mark: React.ReactNode;
  note: string;
}[] = [
  {
    id: "visa",
    label: "Visa",
    mark: <VisaMark className="h-5 w-auto" />,
    note: "Accepted virtually everywhere in Canada",
  },
  {
    id: "mastercard",
    label: "Mastercard",
    mark: <MastercardMark className="h-6 w-auto" />,
    note: "Accepted at Costco & Loblaw banner stores",
  },
  {
    id: "amex",
    label: "American Express",
    mark: <AmexMark className="h-5 w-auto" />,
    note: "Not accepted at Costco or most Loblaw stores",
  },
];

/* ── NetworkModule ──────────────────────────────────────────────────────── */

export default function NetworkModule({
  onChange,
  initialSelected = ["visa", "mastercard", "amex"],
}: NetworkModuleProps) {
  const [selected, setSelected] = useState<Set<CardNetwork>>(
    new Set(initialSelected)
  );

  function toggle(id: CardNetwork) {
    const next = new Set(selected);
    if (next.has(id)) {
      if (next.size === 1) return; // keep at least one network
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
    onChange([...next] as CardNetwork[]);
  }

  return (
    <div className="rounded-2xl border border-[#DADCE0] bg-white p-6 dark:border-[#3C4043] dark:bg-[#292A2D]">
      <div className="mb-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-black dark:text-[#E8EAED]">
          Card Network
        </h2>
        <p className="mt-0.5 text-[12px] text-[#9AA0A6] dark:text-[#5F6368]">
          Deselect networks you can't or prefer not to use
        </p>
      </div>

      <div className="space-y-2">
        {NETWORKS.map(({ id, label, mark, note }) => {
          const isSelected = selected.has(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-all duration-150 ${
                isSelected
                  ? "border-black dark:border-[#E8EAED]"
                  : "border-[#DADCE0] opacity-40 hover:opacity-60 dark:border-[#3C4043]"
              }`}
            >
              {/* Checkbox indicator */}
              <div
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-150 ${
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

              {/* Network mark */}
              <span
                className={`w-16 shrink-0 transition-colors duration-150 ${
                  isSelected
                    ? "text-black dark:text-[#E8EAED]"
                    : "text-[#9AA0A6] dark:text-[#5F6368]"
                }`}
              >
                {mark}
              </span>

              {/* Labels */}
              <div className="flex-1">
                <p
                  className={`text-[13px] font-semibold transition-colors duration-150 ${
                    isSelected
                      ? "text-black dark:text-[#E8EAED]"
                      : "text-[#9AA0A6] dark:text-[#5F6368]"
                  }`}
                >
                  {label}
                </p>
                <p className="text-[11px] text-[#9AA0A6] dark:text-[#5F6368]">
                  {note}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {selected.size < NETWORKS.length && (
        <p className="mt-3 text-[11px] text-[#9AA0A6] dark:text-[#5F6368]">
          At least one network must remain selected
        </p>
      )}
    </div>
  );
}
