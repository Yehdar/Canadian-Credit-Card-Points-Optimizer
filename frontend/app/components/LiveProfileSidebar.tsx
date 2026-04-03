"use client";

import type { ExtractedData } from "@/hooks/useChat";
import type { Profile } from "@/lib/api";

interface LiveProfileSidebarProps {
  extractedData: ExtractedData | null;
  activeProfile: Profile | null;
}

const SPEND_LABELS: { key: keyof NonNullable<ExtractedData["spending"]>; label: string }[] = [
  { key: "groceries",           label: "Groceries" },
  { key: "dining",              label: "Dining" },
  { key: "gas",                 label: "Gas" },
  { key: "travel",              label: "Travel" },
  { key: "entertainment",       label: "Entertainment" },
  { key: "subscriptions",       label: "Subscriptions" },
  { key: "transit",             label: "Transit" },
  { key: "pharmacy",            label: "Pharmacy" },
  { key: "onlineShopping",      label: "Online Shopping" },
  { key: "homeImprovement",     label: "Home Improvement" },
  { key: "canadianTirePartners",label: "Canadian Tire Partners" },
  { key: "foreignPurchases",    label: "Foreign Purchases" },
  { key: "other",               label: "Other" },
];

const REWARD_LABELS: Record<string, string> = {
  cashback: "Cash Back",
  points:   "Points / Travel",
  both:     "Both",
};

const FEE_LABELS: Record<string, string> = {
  no_fee:      "No annual fee",
  include_fee: "Open to fees",
};

function formatCAD(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatIncome(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function Row({ label, value }: { label: string; value: string | null }) {
  const isEmpty = value === null;
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">{label}</span>
      <span
        className={`text-[12px] font-medium ${
          isEmpty
            ? "text-[#DADCE0] dark:text-[#3C4043]"
            : "text-black dark:text-[#E8EAED]"
        }`}
      >
        {isEmpty ? "—" : value}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
      {children}
    </p>
  );
}

export default function LiveProfileSidebar({ extractedData, activeProfile }: LiveProfileSidebarProps) {
  // Determine spending values: extractedData non-null fields take priority,
  // fall back to activeProfile spending, then null (not yet gathered).
  function getSpendValue(key: keyof NonNullable<ExtractedData["spending"]>): string | null {
    const chatVal = extractedData?.spending?.[key];
    if (chatVal !== null && chatVal !== undefined) return formatCAD(chatVal) + "/mo";
    const profileVal = activeProfile?.spending?.[key as keyof typeof activeProfile.spending];
    if (profileVal !== undefined && profileVal !== null && (profileVal as number) > 0) return formatCAD(profileVal as number) + "/mo";

    // Derive from saved arsenal cards: each breakdown.spent is annual → divide by 12
    const savedCards = activeProfile?.savedCards;
    if (savedCards && savedCards.length > 0) {
      let maxSpent = 0;
      for (const card of savedCards) {
        for (const b of card.breakdown ?? []) {
          if (b.category === key && b.spent > maxSpent) maxSpent = b.spent;
        }
      }
      if (maxSpent > 0) return formatCAD(maxSpent / 12) + "/mo";
    }

    return null;
  }

  const annualIncome = extractedData?.annualIncome ?? null;
  const householdIncome = extractedData?.householdIncome ?? null;
  const creditScore = extractedData?.estimatedCreditScore ?? null;

  const rewardType = extractedData?.filters?.rewardType ?? null;
  const feePreference = extractedData?.filters?.feePreference ?? null;
  const networks = extractedData?.filters?.networks ?? null;

  const hasAnyData =
    extractedData !== null ||
    activeProfile !== null;

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-black dark:text-[#E8EAED]">Spending Categories</h2>
        {activeProfile && (
          <span className="rounded-full border border-[#DADCE0] bg-white px-2.5 py-0.5 text-[10px] font-medium text-[#5F6368] dark:border-[#3C4043] dark:bg-[#292A2D] dark:text-[#9AA0A6]">
            {activeProfile.name}
          </span>
        )}
      </div>

      {!hasAnyData ? (
        <p className="mt-6 text-[12px] text-[#9AA0A6] dark:text-[#5F6368]">
          Start chatting — your profile will fill in here as CardGenius learns about you.
        </p>
      ) : (
        <>
          {/* Spending */}
          <SectionTitle>Monthly Spending</SectionTitle>
          <div className="divide-y divide-[#F1F3F4] dark:divide-[#3C4043]">
            {SPEND_LABELS.map(({ key, label }) => (
              <Row key={key} label={label} value={getSpendValue(key)} />
            ))}
          </div>

          {/* Financial profile */}
          <SectionTitle>Financial Profile</SectionTitle>
          <div className="divide-y divide-[#F1F3F4] dark:divide-[#3C4043]">
            <Row
              label="Personal income"
              value={annualIncome !== null ? formatIncome(annualIncome) + "/yr" : null}
            />
            <Row
              label="Household income"
              value={householdIncome !== null ? formatIncome(householdIncome) + "/yr" : null}
            />
            <Row
              label="Credit score"
              value={creditScore !== null ? String(creditScore) : null}
            />
          </div>

          {/* Preferences */}
          <SectionTitle>Preferences</SectionTitle>
          <div className="divide-y divide-[#F1F3F4] dark:divide-[#3C4043]">
            <Row
              label="Reward type"
              value={rewardType ? (REWARD_LABELS[rewardType] ?? rewardType) : null}
            />
            <Row
              label="Annual fee"
              value={feePreference ? (FEE_LABELS[feePreference] ?? feePreference) : null}
            />
            <Row
              label="Networks"
              value={
                networks
                  ? networks.map((n) => n.charAt(0).toUpperCase() + n.slice(1)).join(", ")
                  : null
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
