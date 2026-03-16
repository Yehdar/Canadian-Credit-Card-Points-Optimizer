"use client";

import { useEffect, useState } from "react";
import SpendingForm from "@/app/components/SpendingForm";
import ProfileSwitcher from "@/app/components/ProfileSwitcher";
import CardResults from "@/app/components/CardResults";
import HouseholdOptimizer from "@/app/components/HouseholdOptimizer";
import SaveProfilePrompt from "@/app/components/SaveProfilePrompt";
import { useProfile } from "@/context/ProfileContext";
import { useRecommendations } from "@/hooks/useRecommendations";
import type { SpendingBreakdown } from "@/lib/api";

export default function Home() {
  const { activeProfile, profiles, saveActiveProfileSpending } = useProfile();
  const { results, isCalculating, error, calculate, clearResults } = useRecommendations();

  /**
   * Track the spending used for the last successful anonymous search so we can
   * pass it to SaveProfilePrompt without requiring a saved profile first.
   */
  const [lastAnonymousSpending, setLastAnonymousSpending] =
    useState<SpendingBreakdown | null>(null);

  // Auto re-calculate when the active profile switches.
  // Uses inline spending (not profileId) so the cache keys on the actual values.
  useEffect(() => {
    if (activeProfile) {
      calculate({ spending: activeProfile.spending });
      setLastAnonymousSpending(null);
    } else {
      clearResults();
    }
  }, [activeProfile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(spending: SpendingBreakdown) {
    // Always send the live form state — never the saved profile snapshot.
    // This is the fix for stale-state: the form's `spending` arg is the
    // source of truth, regardless of what the active profile last saved.
    console.debug("[FindBestCards] submitting spending:", JSON.stringify(spending));
    if (!activeProfile) {
      setLastAnonymousSpending(spending);
    }
    calculate({ spending });
  }

  // Show the save prompt only for anonymous (no active profile) searches
  const showSavePrompt = !activeProfile && results.length > 0 && lastAnonymousSpending !== null;

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <ProfileSwitcher />

        <SpendingForm
          onSubmit={handleSubmit}
          onSave={activeProfile ? saveActiveProfileSpending : undefined}
          isLoading={isCalculating}
          initialSpending={activeProfile?.spending}
          activeProfileName={activeProfile?.name}
        />

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        {(results.length > 0 || isCalculating) && (
          <div className="mt-8">
            <CardResults results={results} isCalculating={isCalculating} />
          </div>
        )}

        {showSavePrompt && (
          <SaveProfilePrompt
            spending={lastAnonymousSpending!}
            onSaved={() => setLastAnonymousSpending(null)}
          />
        )}

        {profiles.length >= 2 && (
          <HouseholdOptimizer profiles={profiles} />
        )}
      </div>
    </div>
  );
}
