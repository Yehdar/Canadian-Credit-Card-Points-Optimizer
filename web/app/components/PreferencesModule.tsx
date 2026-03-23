"use client";

import { useState } from "react";

/* ── Types ──────────────────────────────────────────────────────────────── */

export type RewardType = "cashback" | "points" | "both";
export type FeePreference = "no_fee" | "include_fee";

/**
 * Representative numeric values for each credit-score bucket.
 * The backend uses these as `estimatedCreditScore` to gate eligibility.
 */
export const CREDIT_SCORE_OPTIONS = [
  { label: "Not Sure",  value: null  },
  { label: "< 600",     value: 560   },
  { label: "600–699",   value: 650   },
  { label: "700–749",   value: 724   },
  { label: "750+",      value: 780   },
] as const;

export type CreditScoreValue = (typeof CREDIT_SCORE_OPTIONS)[number]["value"];

export interface Preferences {
  rewardType:           RewardType;
  feePreference:        FeePreference;
  annualIncome:         number | null;
  householdIncome:      number | null;
  /** When true the user has toggled to household income mode. */
  useHousehold:         boolean;
  estimatedCreditScore: CreditScoreValue;
}

interface PreferencesModuleProps {
  onChange:      (prefs: Preferences) => void;
  initialPrefs?: Partial<Preferences>;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

const REWARD_OPTIONS: { value: RewardType; label: string }[] = [
  { value: "cashback", label: "Cash Back" },
  { value: "points",   label: "Points"    },
  { value: "both",     label: "Both"      },
];

/* ── PreferencesModule ──────────────────────────────────────────────────── */

export default function PreferencesModule({
  onChange,
  initialPrefs = {},
}: PreferencesModuleProps) {
  const [rewardType,    setRewardType]    = useState<RewardType>(initialPrefs.rewardType    ?? "both");
  const [feePreference, setFeePreference] = useState<FeePreference>(initialPrefs.feePreference ?? "include_fee");
  const [annualIncome,  setAnnualIncome]  = useState<number | null>(initialPrefs.annualIncome  ?? null);
  const [householdIncome, setHouseholdIncome] = useState<number | null>(initialPrefs.householdIncome ?? null);
  const [useHousehold,  setUseHousehold]  = useState(initialPrefs.useHousehold ?? false);
  const [creditScore,   setCreditScore]   = useState<CreditScoreValue>(initialPrefs.estimatedCreditScore ?? null);

  /** Fires onChange with the latest merged state. */
  function emit(patch: Partial<Preferences>) {
    const next: Preferences = {
      rewardType,
      feePreference,
      annualIncome,
      householdIncome,
      useHousehold,
      estimatedCreditScore: creditScore,
      ...patch,
    };
    onChange(next);
  }

  function handleRewardChange(rt: RewardType) {
    setRewardType(rt);
    emit({ rewardType: rt });
  }

  function handleFeeToggle() {
    const next: FeePreference = feePreference === "no_fee" ? "include_fee" : "no_fee";
    setFeePreference(next);
    emit({ feePreference: next });
  }

  function handleIncomeChange(raw: string) {
    const parsed = raw === "" ? null : Math.max(0, parseInt(raw, 10) || 0);
    if (useHousehold) {
      setHouseholdIncome(parsed);
      emit({ householdIncome: parsed });
    } else {
      setAnnualIncome(parsed);
      emit({ annualIncome: parsed });
    }
  }

  function handleHouseholdToggle() {
    const next = !useHousehold;
    setUseHousehold(next);
    emit({ useHousehold: next });
  }

  function handleCreditScoreChange(val: CreditScoreValue) {
    setCreditScore(val);
    emit({ estimatedCreditScore: val });
  }

  const incomeValue = useHousehold ? householdIncome : annualIncome;

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
      <div className="mb-5">
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
                left: feePreference === "include_fee" ? "calc(100% - 1.25rem)" : "0.25rem",
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

      {/* Annual income input */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
            {useHousehold ? "Household Income" : "Personal Income"}
          </p>
          {/* Personal / Household toggle */}
          <button
            type="button"
            onClick={handleHouseholdToggle}
            className="rounded-full border border-[#DADCE0] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-[#5F6368] transition-colors hover:border-black hover:text-black dark:border-[#3C4043] dark:text-[#9AA0A6] dark:hover:border-[#E8EAED] dark:hover:text-[#E8EAED]"
          >
            {useHousehold ? "Switch to Personal" : "Switch to Household"}
          </button>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[13px] font-medium text-[#9AA0A6] dark:text-[#5F6368]">
            $
          </span>
          <input
            type="number"
            min={0}
            step={1000}
            placeholder="e.g. 75000"
            value={incomeValue ?? ""}
            onChange={(e) => handleIncomeChange(e.target.value)}
            className="w-full rounded-xl border border-[#DADCE0] bg-[#F8F9FA] py-3 pl-8 pr-4 text-[13px] font-medium text-black outline-none transition-colors focus:border-black dark:border-[#3C4043] dark:bg-[#202124] dark:text-[#E8EAED] dark:focus:border-[#E8EAED]"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[#9AA0A6] dark:text-[#5F6368]">
          Used to filter out cards you may not qualify for (e.g. Visa Infinite requires $60k)
        </p>
      </div>

      {/* Estimated credit score — segmented control */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
          Estimated Credit Score
        </p>
        <div className="flex overflow-hidden rounded-xl border border-[#DADCE0] dark:border-[#3C4043]">
          {CREDIT_SCORE_OPTIONS.map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleCreditScoreChange(value)}
              className={`flex-1 py-2.5 text-[11px] font-medium leading-tight transition-colors duration-150 ${
                creditScore === value
                  ? "bg-black text-white dark:bg-[#E8EAED] dark:text-[#202124]"
                  : "bg-white text-[#5F6368] hover:text-black dark:bg-[#292A2D] dark:text-[#9AA0A6] dark:hover:text-[#E8EAED]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-[#9AA0A6] dark:text-[#5F6368]">
          Cards below your score threshold are hidden; cards near the limit show a caution notice
        </p>
      </div>
    </div>
  );
}
