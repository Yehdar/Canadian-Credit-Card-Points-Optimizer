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
  const { activeProfile, profiles } = useProfile();
  const { results, isCalculating, error, calculate, clearResults } = useRecommendations();

  /**
   * Track the spending used for the last successful anonymous search so we can
   * pass it to SaveProfilePrompt without requiring a saved profile first.
   */
  const [lastAnonymousSpending, setLastAnonymousSpending] =
    useState<SpendingBreakdown | null>(null);

  // Auto re-calculate whenever the active profile switches
  useEffect(() => {
    if (activeProfile) {
      calculate({ profileId: activeProfile.id, spending: activeProfile.spending });
      setLastAnonymousSpending(null);
    } else {
      clearResults();
    }
  }, [activeProfile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(spending: SpendingBreakdown) {
    if (activeProfile) {
      calculate({ profileId: activeProfile.id, spending: activeProfile.spending });
    } else {
      setLastAnonymousSpending(spending);
      calculate({ spending });
    }
  }

  // Show the save prompt only for anonymous (no active profile) searches
  const showSavePrompt = !activeProfile && results.length > 0 && lastAnonymousSpending !== null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Canadian Credit Card Points Optimizer
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Enter your monthly spending to find the best Canadian credit card for your lifestyle.
          </p>
        </header>

        <ProfileSwitcher />

        <SpendingForm
          onSubmit={handleSubmit}
          isLoading={isCalculating}
          initialSpending={activeProfile?.spending}
          activeProfileName={activeProfile?.name}
        />

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
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
