"use client";

import { useState } from "react";

/* ── Types ──────────────────────────────────────────────────────────────── */

export type RewardType = "cashback" | "points" | "both";
export type FeePreference = "no_fee" | "include_fee";

export interface Preferences {
  rewardType: RewardType;
  feePreference: FeePreference;
}

interface PreferencesModuleProps {
  onChange: (prefs: Preferences) => void;
  initialPrefs?: Partial<Preferences>;
}

/* ── PreferencesModule ──────────────────────────────────────────────────── */

const REWARD_OPTIONS: { value: RewardType; label: string }[] = [
  { value: "cashback", label: "Cash Back" },
  { value: "points",   label: "Points"    },
  { value: "both",     label: "Both"      },
];

export default function PreferencesModule({
  onChange,
  initialPrefs = {},
}: PreferencesModuleProps) {
  const [rewardType, setRewardType] = useState<RewardType>(
    initialPrefs.rewardType ?? "both"
  );
  const [feePreference, setFeePreference] = useState<FeePreference>(
    initialPrefs.feePreference ?? "include_fee"
  );

  function handleRewardChange(rt: RewardType) {
    setRewardType(rt);
    onChange({ rewardType: rt, feePreference });
  }

  function handleFeeToggle() {
    const next: FeePreference = feePreference === "no_fee" ? "include_fee" : "no_fee";
    setFeePreference(next);
    onChange({ rewardType, feePreference: next });
  }

  return (
    <div className="rounded-2xl border border-[#DADCE0] bg-white p-6 dark:border-[#3C4043] dark:bg-[#292A2D]">
      <h2 className="mb-5 text-[15px] font-semibold tracking-tight text-black dark:text-[#E8EAED]">
        Preferences
      </h2>

      {/* Reward type — segmented control */}
      <div className="mb-5">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
          Reward Type
        </p>
        <div className="flex overflow-hidden rounded-xl border border-[#DADCE0] dark:border-[#3C4043]">
          {REWARD_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleRewardChange(value)}
              className={`flex-1 py-2.5 text-[13px] font-medium transition-colors duration-150 ${
                rewardType === value
                  ? "bg-black text-white dark:bg-[#E8EAED] dark:text-[#202124]"
                  : "bg-white text-[#5F6368] hover:text-black dark:bg-[#292A2D] dark:text-[#9AA0A6] dark:hover:text-[#E8EAED]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Annual fee toggle */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
          Annual Fee
        </p>
        <div className="flex items-center justify-between rounded-xl border border-[#DADCE0] bg-[#F8F9FA] px-4 py-3 dark:border-[#3C4043] dark:bg-[#202124]">
          <span className="text-[13px] font-medium text-black dark:text-[#E8EAED]">
            {feePreference === "no_fee" ? "No Fee Cards Only" : "Include Fee Cards"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={feePreference === "include_fee"}
            onClick={handleFeeToggle}
            className={`relative h-6 w-10 shrink-0 overflow-hidden rounded-full transition-colors duration-200 ${
              feePreference === "include_fee"
                ? "bg-black dark:bg-[#E8EAED]"
                : "bg-[#DADCE0] dark:bg-[#3C4043]"
            }`}
          >
            <span
              className="pointer-events-none absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-[left] duration-200 dark:bg-[#202124]"
              style={{
                left: feePreference === "include_fee"
                  ? "calc(100% - 1.25rem)"
                  : "0.25rem",
              }}
            />
          </button>
        </div>
        {feePreference === "no_fee" && (
          <p className="mt-1.5 text-[11px] text-[#9AA0A6] dark:text-[#5F6368]">
            Only cards with $0 annual fee will be shown
          </p>
        )}
      </div>
    </div>
  );
}
