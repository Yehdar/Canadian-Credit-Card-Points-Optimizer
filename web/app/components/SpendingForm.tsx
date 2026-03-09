"use client";

import { useEffect, useState } from "react";
import type { SpendingBreakdown } from "@/lib/api";

interface SpendingFormProps {
  onSubmit: (spending: SpendingBreakdown) => void;
  onSaveProfile?: (spending: SpendingBreakdown) => Promise<void>;
  isLoading: boolean;
  initialSpending?: SpendingBreakdown;
  activeProfileName?: string;
}

const CATEGORIES: { key: keyof SpendingBreakdown; label: string }[] = [
  { key: "groceries",     label: "Groceries" },
  { key: "dining",        label: "Dining & Delivery" },
  { key: "gas",           label: "Gas" },
  { key: "travel",        label: "Travel" },
  { key: "entertainment", label: "Entertainment" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "transit",       label: "Transit" },
  { key: "other",         label: "Other" },
];

const DEFAULT_SPENDING: SpendingBreakdown = {
  groceries: 0, dining: 0, gas: 0, travel: 0,
  entertainment: 0, subscriptions: 0, transit: 0, other: 0,
};

export default function SpendingForm({
  onSubmit,
  onSaveProfile,
  isLoading,
  initialSpending,
  activeProfileName,
}: SpendingFormProps) {
  const [spending, setSpending] = useState<SpendingBreakdown>(
    initialSpending ?? DEFAULT_SPENDING
  );
  const [isSaving, setIsSaving] = useState(false);

  // Sync form when the active profile changes
  useEffect(() => {
    setSpending(initialSpending ?? DEFAULT_SPENDING);
  }, [initialSpending]);

  function handleChange(key: keyof SpendingBreakdown, value: string) {
    setSpending((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  }

  async function handleSave() {
    if (!onSaveProfile) return;
    setIsSaving(true);
    try {
      await onSaveProfile(spending);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(spending); }}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Monthly Spending (CAD)
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {activeProfileName
              ? `Editing spending for "${activeProfileName}"`
              : "Enter your average monthly spend per category to see which Canadian credit card maximizes your rewards."}
          </p>
        </div>
        {onSaveProfile && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {isSaving ? "Saving..." : "Save to Profile"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CATEGORIES.map(({ key, label }) => (
          <div key={key}>
            <label
              htmlFor={key}
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {label}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
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
                className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-7 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-6 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Calculating..." : "Find Best Cards"}
      </button>
    </form>
  );
}
