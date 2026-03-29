"use client";

import { useEffect, useRef, useState } from "react";
import SpendingForm from "@/app/components/SpendingForm";
import ProfileSwitcher from "@/app/components/ProfileSwitcher";
import CardResults from "@/app/components/CardResults";
import SaveProfilePrompt from "@/app/components/SaveProfilePrompt";
import ChatPanel from "@/app/components/ChatPanel";
import ExtractedDataSummary from "@/app/components/ExtractedDataSummary";
import { useProfile } from "@/context/ProfileContext";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useChat } from "@/hooks/useChat";
import type { SpendingBreakdown, SpendingFormSubmission } from "@/lib/api";

export default function Home() {
  const { activeProfile, saveActiveProfileSpending } = useProfile();
  const { results, isCalculating, error, calculate, clearResults } = useRecommendations();
  const { messages, isLoading: isChatLoading, extractedData, recommendationData, sendMessage } = useChat();

  const resultsRef = useRef<HTMLDivElement>(null);

  const [chatMode, setChatMode] = useState(true);
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

  // When the chat completes and recommendation data is ready, trigger calculation.
  useEffect(() => {
    if (recommendationData) {
      handleChatRecommendation(recommendationData);
    }
  }, [recommendationData]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChatRecommendation(submission: SpendingFormSubmission) {
    calculate(submission);
    if (resultsRef.current) {
      resultsRef.current.scrollTop = 0;
    }
  }

  function handleSubmit({ spending, filters, annualIncome, householdIncome, estimatedCreditScore }: SpendingFormSubmission) {
    console.debug("[FindBestCards] submitting:", JSON.stringify({ spending, filters, annualIncome, householdIncome, estimatedCreditScore }));
    if (!activeProfile) {
      setLastAnonymousSpending(spending);
    }
    calculate({ spending, filters, annualIncome, householdIncome, estimatedCreditScore });
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
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-[#F8F9FA] dark:bg-[#202124] lg:min-h-0 lg:h-[calc(100vh-3.5rem)] lg:flex-row lg:overflow-hidden">

      {/* ── Left pane — inputs ─────────────────────────────────────────── */}
      <aside className="scroll-pane shrink-0 border-b border-[#DADCE0] bg-[#F8F9FA] px-6 py-6 dark:border-[#3C4043] dark:bg-[#202124] lg:w-2/5 lg:overflow-y-auto lg:border-b-0 lg:border-r">

        <ProfileSwitcher />

        {/* ── Mode toggle ── */}
        <div className="mb-5 mt-5 flex items-center gap-1 rounded-lg border border-[#DADCE0] bg-white p-1 dark:border-[#3C4043] dark:bg-[#2D2E30]">
          <TabButton active={chatMode} onClick={() => setChatMode(true)}>
            <span className="mr-1.5">✦</span>Chat
          </TabButton>
          <TabButton active={!chatMode} onClick={() => setChatMode(false)}>
            Manual Form
          </TabButton>
        </div>

        {chatMode ? (
          <>
            <ChatPanel
              messages={messages}
              isLoading={isChatLoading}
              isDone={!!recommendationData}
              onSendMessage={sendMessage}
            />
            <ExtractedDataSummary
              data={extractedData}
              isDone={!!recommendationData}
              onFindCards={() => {
                if (recommendationData) handleChatRecommendation(recommendationData);
              }}
              onManualEntry={() => setChatMode(false)}
            />
          </>
        ) : (
          <SpendingForm
            onSubmit={handleSubmit}
            onSave={activeProfile ? saveActiveProfileSpending : undefined}
            isLoading={isCalculating}
            initialSpending={activeProfile?.spending}
            activeProfileName={activeProfile?.name}
          />
        )}

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
          </div>
        ) : (
          /* Empty state — only rendered at lg+ where the pane has fixed height */
          <div className="hidden h-full flex-col items-center justify-center lg:flex">
            <p className="text-[13px] text-[#9AA0A6] dark:text-[#5F6368]">
              {chatMode
                ? <>Chat with <span className="font-medium text-black dark:text-[#E8EAED]">CardGenius</span> to find your best card.</>
                : <>Enter your monthly spending and click{" "}<span className="font-medium text-black dark:text-[#E8EAED]">Find Best Cards</span>.</>
              }
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-md py-1.5 text-[13px] font-medium transition ${
        active
          ? "bg-[#1A73E8] text-white shadow-sm"
          : "text-[#5F6368] hover:bg-[#F1F3F4] dark:text-[#9AA0A6] dark:hover:bg-[#3C4043]"
      }`}
    >
      {children}
    </button>
  );
}
