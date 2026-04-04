"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import ChatPanel from "@/app/components/ChatPanel";
import LiveProfileSidebar from "@/app/components/LiveProfileSidebar";
import ArsenalModal from "@/app/components/ArsenalModal";
import SavedCatalog from "@/app/components/SavedCatalog";
import SplashScreen from "@/app/components/SplashScreen";
import { useProfile } from "@/context/ProfileContext";
import { useChat } from "@/hooks/useChat";
import type { ArsenalCard } from "@/hooks/useChat";
import type { RecommendationResult, SavedCard, SpendingBreakdown } from "@/lib/api";

export default function Home() {
  const { activeProfile, saveCardsToProfile } = useProfile();
  const { messages, isLoading: isChatLoading, extractedData, results, arsenalCards, isDone, sendMessage, getCards, reSyncCard, addBotMessage, resetChat } = useChat();

  const [showSplash, setShowSplash] = useState(true);
  const [arsenalOpen, setArsenalOpen] = useState(false);
  const [savedCatalogOpen, setSavedCatalogOpen] = useState(false);
  const [savedCardView, setSavedCardView] = useState<SavedCard | null>(null);

  // Reset chat state when the active profile changes.
  useEffect(() => {
    resetChat();
    setArsenalOpen(false);
    setSavedCatalogOpen(false);
    setSavedCardView(null);
  }, [activeProfile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Open the Arsenal modal once Gemini returns results.
  useEffect(() => {
    if (results.length > 0 && isDone) {
      setArsenalOpen(true);
    }
  }, [results, isDone]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSaveCards() {
    if (!activeProfile) return;
    const cards: SavedCard[] = activeResults.map((r) => {
      const ac = arsenalCards.find((c: ArsenalCard) => c.name === r.card.name);
      return {
        name:               r.card.name,
        issuer:             r.card.issuer,
        annualFee:          r.card.annualFee,
        pointsCurrency:     r.card.pointsCurrency,
        cardType:           r.card.cardType,
        isPointsBased:      r.card.isPointsBased,
        breakdown:          r.breakdown,
        totalPointsEarned:  r.totalPointsEarned,
        totalValueCAD:      r.totalValueCAD,
        netAnnualValue:     r.netAnnualValue,
        eligibilityWarning: r.eligibilityWarning,
        purpose:            ac?.purpose     ?? "",
        description:        ac?.description ?? "",
        visualConfig:       ac?.visualConfig,
      };
    });
    const s = extractedData?.spending;
    const spending: SpendingBreakdown | undefined = s ? {
      groceries:            s.groceries            ?? 0,
      dining:               s.dining               ?? 0,
      gas:                  s.gas                  ?? 0,
      travel:               s.travel               ?? 0,
      entertainment:        s.entertainment        ?? 0,
      subscriptions:        s.subscriptions        ?? 0,
      transit:              s.transit              ?? 0,
      other:                s.other                ?? 0,
      pharmacy:             s.pharmacy             ?? 0,
      onlineShopping:       s.onlineShopping       ?? 0,
      homeImprovement:      s.homeImprovement      ?? 0,
      canadianTirePartners: s.canadianTirePartners ?? 0,
      foreignPurchases:     s.foreignPurchases     ?? 0,
    } : undefined;

    saveCardsToProfile(cards, extractedData, spending);
  }

  function handleReSyncCard(card: SavedCard) {
    reSyncCard(card, activeProfile?.extractedSnapshot);
  }

  function handleViewSavedCard(card: SavedCard) {
    setSavedCardView(card);
    setSavedCatalogOpen(false);
  }

  const activeResults = useMemo(() => {
    if (arsenalCards.length > 0) {
      const names = new Set(arsenalCards.map((c: ArsenalCard) => c.name));
      return results.filter(r => names.has(r.card.name));
    }
    return results;
  }, [results, arsenalCards]);

  const savedCardModalData = useMemo(() => {
    if (!savedCardView) return null;
    const result: RecommendationResult = {
      card: {
        id: 0,
        name: savedCardView.name,
        issuer: savedCardView.issuer,
        annualFee: savedCardView.annualFee,
        pointsCurrency: savedCardView.pointsCurrency,
        cardType: savedCardView.cardType,
        isPointsBased: savedCardView.isPointsBased,
      },
      breakdown: savedCardView.breakdown,
      totalPointsEarned: savedCardView.totalPointsEarned,
      totalValueCAD: savedCardView.totalValueCAD,
      netAnnualValue: savedCardView.netAnnualValue,
      eligibilityWarning: savedCardView.eligibilityWarning,
    };
    const arsenal: ArsenalCard = {
      name: savedCardView.name,
      purpose: savedCardView.purpose,
      description: savedCardView.description,
      visualConfig: savedCardView.visualConfig,
    };
    return { result, arsenal };
  }, [savedCardView]);

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onDismiss={() => setShowSplash(false)} />}
      </AnimatePresence>

      {/*
        Mobile  : single column, standard page scroll
        Desktop : fixed-height split pane — left (60%) fixed, right (40%) scrolls independently
      */}
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-[#F8F9FA] dark:bg-[#202124] lg:min-h-0 lg:h-[calc(100vh-3.5rem)] lg:flex-row lg:overflow-hidden">

      {/* ── Left pane — chat ───────────────────────────────────────────── */}
      <aside className="scroll-pane shrink-0 flex flex-col border-b border-[#DADCE0] bg-[#F8F9FA] px-6 py-6 dark:border-[#3C4043] dark:bg-[#202124] lg:w-3/5 lg:overflow-hidden lg:border-b-0 lg:border-r">
        <ChatPanel
          messages={messages}
          isLoading={isChatLoading}
          isDone={isDone}
          onSendMessage={sendMessage}
          hasCards={activeResults.length > 0}
          onViewCards={() => setArsenalOpen(true)}
          hasSavedCards={!!(activeProfile?.savedCards?.length)}
          onViewSavedCards={() => setSavedCatalogOpen(true)}
          onGetCards={getCards}
          canGetCards={messages.some(m => m.role === "user")}
        />
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
          arsenalCards={arsenalCards}
          onClose={() => setArsenalOpen(false)}
          activeProfileName={activeProfile?.name ?? null}
          onSaveCards={activeProfile ? handleSaveCards : null}
        />
      )}

      {/* ── Saved Catalog Modal ────────────────────────────────────────── */}
      {savedCatalogOpen && !!(activeProfile?.savedCards?.length) && (
        <SavedCatalog
          savedCards={activeProfile!.savedCards!}
          onClose={() => setSavedCatalogOpen(false)}
          onReSyncCard={handleReSyncCard}
          onViewCard={handleViewSavedCard}
          snapshot={activeProfile?.extractedSnapshot ?? null}
        />
      )}

      {/* ── Single Saved Card 3D Preview ───────────────────────────────── */}
      {savedCardModalData && (
        <ArsenalModal
          results={[savedCardModalData.result]}
          arsenalCards={[savedCardModalData.arsenal]}
          onClose={() => setSavedCardView(null)}
          activeProfileName={null}
          onSaveCards={null}
        />
      )}

      {/* ── Dev: reopen splash ─────────────────────────────────────────── */}
      {process.env.NODE_ENV === "development" && (
        <button
          onClick={() => {
            sessionStorage.removeItem("arsenal_splash_seen");
            setShowSplash(true);
          }}
          className="fixed bottom-4 right-4 z-[300] rounded-md bg-black/70 px-3 py-1.5 text-[11px] font-mono text-white/60 ring-1 ring-white/20 backdrop-blur hover:bg-black/90"
        >
          [dev] splash
        </button>
      )}
    </div>
    </>
  );
}
