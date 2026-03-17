"use client";

import { useState } from "react";
import type {
  SpendingBreakdown,
  SpendingFormSubmission,
  FormFilters,
  RewardType,
  FeePreference,
  CardNetwork,
} from "@/lib/api";

import SpendingModule     from "./SpendingModule";
import PreferencesModule  from "./PreferencesModule";
import BonusesModule      from "./BonusesModule";
import InstitutionsModule from "./InstitutionsModule";
import NetworkModule      from "./NetworkModule";
import BenefitsModule     from "./BenefitsModule";

import type { Preferences }     from "./PreferencesModule";
import type { Bonuses }         from "./BonusesModule";
import type { BenefitSelection } from "./BenefitsModule";

/* ── Props ──────────────────────────────────────────────────────────────── */

interface SpendingFormProps {
  onSubmit:           (submission: SpendingFormSubmission) => void;
  onSave?:            (spending: SpendingBreakdown) => Promise<void>;
  isLoading:          boolean;
  initialSpending?:   SpendingBreakdown;
  activeProfileName?: string;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

const DEFAULT_SPENDING: SpendingBreakdown = {
  groceries: 0, dining: 0, gas: 0, travel: 0,
  entertainment: 0, subscriptions: 0, transit: 0, other: 0,
};

const DEFAULT_FILTERS: FormFilters = {
  rewardType:    "both",
  feePreference: "include_fee",
  rogersOwner:   false,
  amazonPrime:   false,
  institutions:  [],
  networks:      ["visa", "mastercard", "amex"],
  benefits: {
    noForeignFee:        false,
    airportLounge:       false,
    loungeVisitsPerYear: 4,
    priorityTravel:      false,
    freeCheckedBag:      false,
  },
};

/**
 * Maps the 8-field SpendingBreakdown (API shape) to the category keys used
 * by SpendingModule. Foreign / pharmacy / online / home / ctPartners have no
 * reverse mapping, so they default to 0 on pre-fill.
 */
function toModuleInitialValues(s: SpendingBreakdown): Record<string, number> {
  return {
    food:      s.dining,
    grocery:   s.groceries,
    recurring: s.subscriptions,
    gas:       s.gas,
    transport: s.transit,
    entertain: s.entertainment,
    travel:    s.travel,
    other:     s.other,
  };
}

/* ── SpendingForm ───────────────────────────────────────────────────────── */

export default function SpendingForm({
  onSubmit,
  onSave,
  isLoading,
  initialSpending,
  activeProfileName,
}: SpendingFormProps) {
  // Spending state (normalised by SpendingModule to SpendingBreakdown)
  const [spending, setSpending] = useState<SpendingBreakdown>(
    initialSpending ?? DEFAULT_SPENDING
  );

  // Filter state
  const [preferences,  setPreferences]  = useState<Preferences>({
    rewardType:    DEFAULT_FILTERS.rewardType    as RewardType,
    feePreference: DEFAULT_FILTERS.feePreference as FeePreference,
  });
  const [bonuses,      setBonuses]      = useState<Bonuses>({
    rogersOwner: DEFAULT_FILTERS.rogersOwner,
    amazonPrime: DEFAULT_FILTERS.amazonPrime,
  });
  const [institutions, setInstitutions] = useState<string[]>(DEFAULT_FILTERS.institutions);
  const [networks,     setNetworks]     = useState<CardNetwork[]>(
    DEFAULT_FILTERS.networks as CardNetwork[]
  );
  const [benefits,     setBenefits]     = useState<BenefitSelection>(
    DEFAULT_FILTERS.benefits
  );

  const [isSaving, setIsSaving] = useState(false);

  // Build the FormFilters object from local state
  function buildFilters(): FormFilters {
    return {
      rewardType:    preferences.rewardType,
      feePreference: preferences.feePreference,
      rogersOwner:   bonuses.rogersOwner,
      amazonPrime:   bonuses.amazonPrime,
      institutions,
      networks:      networks as CardNetwork[],
      benefits,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ spending, filters: buildFilters() });
  }

  async function handleSave() {
    if (!onSave) return;
    setIsSaving(true);
    try { await onSave(spending); }
    finally { setIsSaving(false); }
  }

  // Re-key SpendingModule when the profile changes so its internal state resets
  const spendingModuleKey = JSON.stringify(initialSpending ?? {});

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Profile context line */}
      <div className="flex items-baseline justify-between px-1">
        <p className="text-[12px] text-[#9AA0A6] dark:text-[#5F6368]">
          {activeProfileName
            ? `Editing "${activeProfileName}"`
            : "Enter your average spend in CAD"}
        </p>
        <span className="text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
          CAD
        </span>
      </div>

      {/* ── Section 1: Spending ─────────────────────────────────────────── */}
      <SpendingModule
        key={spendingModuleKey}
        onChange={setSpending}
        initialValues={initialSpending ? toModuleInitialValues(initialSpending) : undefined}
      />

      {/* ── Section 2: Preferences ─────────────────────────────────────── */}
      <PreferencesModule onChange={setPreferences} />

      {/* ── Section 3: Subscription Bonuses ────────────────────────────── */}
      <BonusesModule onChange={setBonuses} />

      {/* ── Section 4: Institutions ────────────────────────────────────── */}
      <InstitutionsModule onChange={setInstitutions} />

      {/* ── Section 5: Card Network ────────────────────────────────────── */}
      <NetworkModule onChange={setNetworks} />

      {/* ── Section 6: Benefits ────────────────────────────────────────── */}
      <BenefitsModule onChange={setBenefits} />

      {/* ── Action row ─────────────────────────────────────────────────── */}
      <div className={`flex gap-3 pt-2 ${onSave ? "flex-col sm:flex-row" : ""}`}>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-full bg-black py-3 text-[13px] font-semibold text-white transition-all duration-150 active:scale-[0.98] hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#E8EAED] dark:text-[#202124] dark:hover:opacity-90"
        >
          {isLoading ? "Calculating…" : "Find Best Cards"}
        </button>

        {onSave && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full border border-[#DADCE0] px-6 py-3 text-[13px] font-medium text-black transition-all duration-150 active:scale-[0.98] hover:border-black disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#3C4043] dark:text-[#E8EAED] dark:hover:border-[#E8EAED]"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        )}
      </div>
    </form>
  );
}
