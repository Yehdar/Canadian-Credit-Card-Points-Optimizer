"use client";

import { useState } from "react";
import SpendingForm from "@/app/components/SpendingForm";
import ProfileSwitcher from "@/app/components/ProfileSwitcher";
import CardResults from "@/app/components/CardResults";
import { fetchRecommendations } from "@/lib/api";
import type { RecommendationResult, SpendingBreakdown } from "@/lib/api";
import { useProfile } from "@/context/ProfileContext";

export default function Home() {
  const { activeProfile, saveActiveProfileSpending } = useProfile();

  const [results, setResults] = useState<RecommendationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(spending: SpendingBreakdown) {
    setIsLoading(true);
    setError(null);
    try {
      // Prefer profile-based recommendation when a profile is active
      const args = activeProfile
        ? { profileId: activeProfile.id }
        : { spending };
      const data = await fetchRecommendations(args);
      setResults(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Is the backend running?"
      );
    } finally {
      setIsLoading(false);
    }
  }

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
          onSaveProfile={activeProfile ? saveActiveProfileSpending : undefined}
          isLoading={isLoading}
          initialSpending={activeProfile?.spending}
          activeProfileName={activeProfile?.name}
        />

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8">
            <CardResults results={results} />
          </div>
        )}
      </div>
    </div>
  );
}
