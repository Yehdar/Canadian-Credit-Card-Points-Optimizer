"use client";

import { useEffect, useState } from "react";
import ProfileSwitcher from "@/app/components/ProfileSwitcher";
import ChatPanel from "@/app/components/ChatPanel";
import LiveProfileSidebar from "@/app/components/LiveProfileSidebar";
import ArsenalModal from "@/app/components/ArsenalModal";
import ActiveArsenalBanner from "@/app/components/ActiveArsenalBanner";
import { useProfile } from "@/context/ProfileContext";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useChat } from "@/hooks/useChat";
import type { RecommendationResult } from "@/lib/api";

// Dev-only mock data for the Arsenal skip tool.
const DEV_MOCK_RESULTS: RecommendationResult[] = [
  {
    card: { id: 999, name: "PC Financial Mastercard", issuer: "PC Financial", annualFee: 0, pointsCurrency: "PC Optimum", cardType: "mastercard", isPointsBased: true },
    breakdown: [{ category: "groceries", spent: 6000, pointsEarned: 60000, valueCAD: 90 }],
    totalPointsEarned: 60000,
    totalValueCAD: 90,
    netAnnualValue: 90,
    eligibilityWarning: undefined,
  },
  {
    card: { id: 998, name: "CIBC Dividend Visa Infinite", issuer: "CIBC", annualFee: 120, pointsCurrency: "Cash Back", cardType: "visa", isPointsBased: false },
    breakdown: [{ category: "dining", spent: 3600, pointsEarned: 0, valueCAD: 72 }, { category: "gas", spent: 1200, pointsEarned: 0, valueCAD: 24 }],
    totalPointsEarned: 0,
    totalValueCAD: 144,
    netAnnualValue: 24,
    eligibilityWarning: undefined,
  },
  {
    card: { id: 997, name: "Wealthsimple Cash Visa Prepaid", issuer: "Wealthsimple", annualFee: 0, pointsCurrency: "Cash Back", cardType: "visa", isPointsBased: false },
    breakdown: [{ category: "other", spent: 2400, pointsEarned: 0, valueCAD: 24 }],
    totalPointsEarned: 0,
    totalValueCAD: 24,
    netAnnualValue: 24,
    eligibilityWarning: undefined,
  },
];

const DEV_MOCK_ARSENAL_CARDS = [
  { name: "PC Financial Mastercard", purpose: "The Grocery Powerhouse", description: "Earns 45 PC Optimum points per $1 at Loblaw stores — your primary earn engine for weekly grocery runs." },
  { name: "CIBC Dividend Visa Infinite", purpose: "Dining & Gas Anchor", description: "4% cash back on dining and gas, covering your top discretionary categories with a solid return." },
  { name: "Wealthsimple Cash Visa Prepaid", purpose: "The No-Fee Backup", description: "1% on everything else with zero annual fee — perfect for purchases that don't fit your other cards." },
];

export default function Home() {
  const { activeProfile } = useProfile();
  const { results, isCalculating, calculate } = useRecommendations();
  const { messages, isLoading: isChatLoading, extractedData, recommendationData, arsenalCards, isDone, sendMessage, addBotMessage } = useChat();

  const [arsenalOpen, setArsenalOpen] = useState(false);
  const [viewedArsenal, setViewedArsenal] = useState<RecommendationResult[]>([]);
  const [devResults, setDevResults] = useState<RecommendationResult[] | null>(null);

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
    setViewedArsenal(devResults ?? results);
    addBotMessage("Want to keep chatting to better tailor your arsenal? I can swap out cards if these don't fit your vibe. 🎯");
  }

  function handleDevSkip() {
    setDevResults(DEV_MOCK_RESULTS);
    setArsenalOpen(true);
  }

  const activeResults = devResults ?? results;
  const activeArsenalCards = devResults ? DEV_MOCK_ARSENAL_CARDS : arsenalCards;

  return (
    /*
      Mobile  : single column, standard page scroll
      Desktop : fixed-height split pane — left (60%) fixed, right (40%) scrolls independently
    */
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-[#F8F9FA] dark:bg-[#202124] lg:min-h-0 lg:h-[calc(100vh-3.5rem)] lg:flex-row lg:overflow-hidden">

      {/* ── Left pane — chat ───────────────────────────────────────────── */}
      <aside className="scroll-pane shrink-0 flex flex-col border-b border-[#DADCE0] bg-[#F8F9FA] px-6 py-6 dark:border-[#3C4043] dark:bg-[#202124] lg:w-3/5 lg:overflow-y-auto lg:border-b-0 lg:border-r">

        {/* Sticky arsenal banner — sits at the very top of the scrollable pane */}
        <ActiveArsenalBanner
          cards={viewedArsenal}
          onClick={() => setArsenalOpen(true)}
        />

        <ProfileSwitcher />

        <div className="mt-5 flex-1">
          <ChatPanel
            messages={messages}
            isLoading={isChatLoading || isCalculating}
            isDone={isDone}
            onSendMessage={sendMessage}
          />
        </div>
      </aside>

      {/* ── Right pane — live profile summary ─────────────────────────── */}
      <main className="scroll-pane flex-1 border-t border-[#DADCE0] bg-white dark:border-[#3C4043] dark:bg-[#292A2D] lg:w-2/5 lg:flex-none lg:overflow-y-auto lg:border-t-0">
        <LiveProfileSidebar
          extractedData={extractedData}
          activeProfile={activeProfile}
        />
      </main>

      {/* ── Arsenal Modal ──────────────────────────────────────────────── */}
      {arsenalOpen && activeResults.length > 0 && (
        <ArsenalModal
          results={activeResults}
          arsenalCards={activeArsenalCards}
          onClose={handleCloseArsenal}
          onDevSkip={process.env.NODE_ENV === "development" ? handleDevSkip : undefined}
        />
      )}

      {/* ── Dev skip button (development only) ────────────────────────── */}
      {process.env.NODE_ENV === "development" && !arsenalOpen && (
        <button
          onClick={handleDevSkip}
          className="fixed bottom-4 left-4 z-[60] rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black shadow-lg transition hover:bg-yellow-300"
        >
          DEV ⚡ Skip to Arsenal
        </button>
      )}
    </div>
  );
}
