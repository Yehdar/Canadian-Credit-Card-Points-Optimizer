"use client";

import { useEffect, useState } from "react";
import type { SpendingBreakdown } from "@/lib/api";

interface SpendingFormProps {
  onSubmit: (spending: SpendingBreakdown) => void;
  onSave?:  (spending: SpendingBreakdown) => Promise<void>;
  isLoading: boolean;
  initialSpending?: SpendingBreakdown;
  activeProfileName?: string;
}

const CATEGORIES: { key: keyof SpendingBreakdown; label: string }[] = [
  { key: "groceries",     label: "Groceries"      },
  { key: "dining",        label: "Dining"          },
  { key: "gas",           label: "Gas"             },
  { key: "travel",        label: "Travel"          },
  { key: "entertainment", label: "Entertainment"   },
  { key: "subscriptions", label: "Subscriptions"   },
  { key: "transit",       label: "Transit"         },
  { key: "other",         label: "Other"           },
];

const DEFAULT_SPENDING: SpendingBreakdown = {
  groceries: 0, dining: 0, gas: 0, travel: 0,
  entertainment: 0, subscriptions: 0, transit: 0, other: 0,
};

export default function SpendingForm({
  onSubmit,
  onSave,
  isLoading,
  initialSpending,
  activeProfileName,
}: SpendingFormProps) {
  const [spending, setSpending] = useState<SpendingBreakdown>(initialSpending ?? DEFAULT_SPENDING);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSpending(initialSpending ?? DEFAULT_SPENDING);
  }, [initialSpending]);

  function handleChange(key: keyof SpendingBreakdown, value: string) {
    setSpending((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  }

  async function handleSave() {
    if (!onSave) return;
    setIsSaving(true);
    try { await onSave(spending); }
    finally { setIsSaving(false); }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(spending); }}
      className="rounded-2xl border border-[#EBEBEB] bg-white p-6 dark:border-[#1F1F1F] dark:bg-[#111111]"
    >
      {/* Form header */}
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-black dark:text-[#EDEDED]">
            Monthly Spending
          </h2>
          <p className="mt-0.5 text-[12px] text-[#A8A8A8] dark:text-[#555555]">
            {activeProfileName
              ? `Editing "${activeProfileName}"`
              : "Enter your average monthly spend in CAD"}
          </p>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-widest text-[#A8A8A8] dark:text-[#555555]">
          CAD / mo
        </span>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CATEGORIES.map(({ key, label }) => (
          <div key={key} className="group">
            <label
              htmlFor={key}
              className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-[#A8A8A8] transition-colors duration-150 group-focus-within:text-black dark:text-[#555555] dark:group-focus-within:text-[#EDEDED]"
            >
              {label}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[13px] text-[#C0C0C0] dark:text-[#333333]">
                $
              </span>
              <input
                id={key}
                type="number"
                min="0"
                step="1"
                value={spending[key] || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-[#EBEBEB] bg-[#FAFAFA] py-3 pl-8 pr-4 text-[14px] text-black placeholder:text-[#D0D0D0] transition-all duration-150 focus:border-black focus:bg-white focus:outline-none dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#EDEDED] dark:placeholder:text-[#333333] dark:focus:border-[#EDEDED] dark:focus:bg-[#111111]"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action row */}
      <div className={`mt-6 flex gap-3 ${onSave ? "sm:flex-row flex-col" : ""}`}>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-full bg-black py-3 text-[13px] font-semibold text-white transition-all duration-150 active:scale-[0.98] hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#EDEDED] dark:text-[#0A0A0A] dark:hover:opacity-90"
        >
          {isLoading ? "Calculating…" : "Find Best Cards"}
        </button>

        {onSave && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full border border-[#EBEBEB] px-6 py-3 text-[13px] font-medium text-black transition-all duration-150 active:scale-[0.98] hover:border-black disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#1F1F1F] dark:text-[#EDEDED] dark:hover:border-[#EDEDED]"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        )}
      </div>
    </form>
  );
}
