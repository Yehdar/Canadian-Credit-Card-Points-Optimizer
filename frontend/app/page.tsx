"use client";

import { useEffect, useState } from "react";
import ProfileSwitcher from "@/app/components/ProfileSwitcher";
import ChatPanel from "@/app/components/ChatPanel";
import LiveProfileSidebar from "@/app/components/LiveProfileSidebar";
import ArsenalModal from "@/app/components/ArsenalModal";
import { useProfile } from "@/context/ProfileContext";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useChat } from "@/hooks/useChat";
import type { RecommendationResult } from "@/lib/api";

export default function Home() {
  const { activeProfile } = useProfile();
  const { results, isCalculating, calculate } = useRecommendations();
  const { messages, isLoading: isChatLoading, extractedData, recommendationData, arsenalInsights, sendMessage } = useChat();

  const [arsenalOpen, setArsenalOpen] = useState(false);
  const [viewedArsenal, setViewedArsenal] = useState<RecommendationResult[]>([]);

  // When Gemini completes, auto-fetch recommendations and open the Arsenal.
  useEffect(() => {
    if (recommendationData) {
      calculate(recommendationData);
    }
  }, [recommendationData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Open the Arsenal modal once results arrive from a chat-triggered calculation.
  useEffect(() => {
    if (results.length > 0 && recommendationData && !isCalculating) {
      setArsenalOpen(true);
    }
  }, [results, isCalculating]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCloseArsenal() {
    setArsenalOpen(false);
    setViewedArsenal(results);
  }

  return (
    /*
      Mobile  : single column, standard page scroll
      Desktop : fixed-height split pane — left (60%) fixed, right (40%) scrolls independently
    */
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-[#F8F9FA] dark:bg-[#202124] lg:min-h-0 lg:h-[calc(100vh-3.5rem)] lg:flex-row lg:overflow-hidden">

      {/* ── Left pane — chat ───────────────────────────────────────────── */}
      <aside className="scroll-pane shrink-0 flex flex-col border-b border-[#DADCE0] bg-[#F8F9FA] px-6 py-6 dark:border-[#3C4043] dark:bg-[#202124] lg:w-3/5 lg:overflow-y-auto lg:border-b-0 lg:border-r">

        <ProfileSwitcher />

        <div className="mt-5 flex-1">
          <ChatPanel
            messages={messages}
            isLoading={isChatLoading || isCalculating}
            isDone={!!recommendationData}
            onSendMessage={sendMessage}
          />
        </div>

        {/* Re-open Arsenal button — shown after modal has been closed */}
        {viewedArsenal.length > 0 && !arsenalOpen && (
          <button
            onClick={() => setArsenalOpen(true)}
            className="mt-4 w-full rounded-xl border border-[#DADCE0] bg-white py-3 text-[13px] font-medium text-[#202124] transition hover:bg-[#F1F3F4] dark:border-[#3C4043] dark:bg-[#292A2D] dark:text-[#E8EAED] dark:hover:bg-[#3C4043]"
          >
            View Your Card Arsenal →
          </button>
        )}
      </aside>

      {/* ── Right pane — live profile summary ─────────────────────────── */}
      <main className="scroll-pane flex-1 border-t border-[#DADCE0] bg-white dark:border-[#3C4043] dark:bg-[#292A2D] lg:w-2/5 lg:flex-none lg:overflow-y-auto lg:border-t-0">
        <LiveProfileSidebar
          extractedData={extractedData}
          activeProfile={activeProfile}
        />
      </main>

      {/* ── Arsenal Modal ──────────────────────────────────────────────── */}
      {arsenalOpen && results.length > 0 && (
        <ArsenalModal
          results={results}
          insights={arsenalInsights ?? {}}
          onClose={handleCloseArsenal}
        />
      )}
    </div>
  );
}
