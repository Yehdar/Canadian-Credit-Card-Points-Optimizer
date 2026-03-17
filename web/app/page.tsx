"use client";

import { useEffect, useRef, useState } from "react";
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

  const resultsRef = useRef<HTMLDivElement>(null);

  const [lastAnonymousSpending, setLastAnonymousSpending] =
    useState<SpendingBreakdown | null>(null);

  // Auto re-calculate when the active profile switches.
  useEffect(() => {
    if (activeProfile) {
      calculate({ spending: activeProfile.spending });
      setLastAnonymousSpending(null);
    } else {
      clearResults();
    }
  }, [activeProfile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(spending: SpendingBreakdown) {
    console.debug("[FindBestCards] submitting spending:", JSON.stringify(spending));
    if (!activeProfile) {
      setLastAnonymousSpending(spending);
    }
    calculate({ spending });
    // Scroll results pane back to top on every new search
    if (resultsRef.current) {
      resultsRef.current.scrollTop = 0;
    }
  }

  const showSavePrompt = !activeProfile && results.length > 0 && lastAnonymousSpending !== null;

  return (
    /*
      Mobile  : single column, standard page scroll
      Desktop : fixed-height split pane — left fixed, right scrolls independently
    */
    <div className="flex flex-col bg-[#F8F9FA] dark:bg-[#202124] lg:h-[calc(100vh-3.5rem)] lg:flex-row lg:overflow-hidden">

      {/* ── Left pane — inputs ─────────────────────────────────────────── */}
      <aside className="scroll-pane shrink-0 border-b border-[#DADCE0] bg-[#F8F9FA] px-6 py-8 dark:border-[#3C4043] dark:bg-[#202124] lg:w-2/5 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <ProfileSwitcher />

        <SpendingForm
          onSubmit={handleSubmit}
          onSave={activeProfile ? saveActiveProfileSpending : undefined}
          isLoading={isCalculating}
          initialSpending={activeProfile?.spending}
          activeProfileName={activeProfile?.name}
        />

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}
      </aside>

      {/* ── Right pane — results ───────────────────────────────────────── */}
      <main ref={resultsRef} className="scroll-pane flex-1 px-6 py-8 lg:overflow-y-auto">
        {(results.length > 0 || isCalculating) ? (
          <div className="space-y-6">
            <CardResults results={results} isCalculating={isCalculating} />

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
        ) : (
          /* Empty state — only rendered at lg+ where the pane has fixed height */
          <div className="hidden h-full flex-col items-center justify-center lg:flex">
            <p className="text-[13px] text-[#9AA0A6] dark:text-[#5F6368]">
              Enter your monthly spending and click{" "}
              <span className="font-medium text-black dark:text-[#E8EAED]">Find Best Cards</span>.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
