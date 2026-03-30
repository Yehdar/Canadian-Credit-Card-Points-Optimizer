"use client";

import type { ExtractedData } from "@/hooks/useChat";

interface ExtractedDataSummaryProps {
  data: ExtractedData | null;
  isDone: boolean;
  onFindCards: () => void;
  onManualEntry: () => void;
}

const SPENDING_LABELS: Record<string, string> = {
  groceries:            "Groceries",
  dining:               "Dining",
  gas:                  "Gas & Fuel",
  travel:               "Travel",
  entertainment:        "Entertainment",
  subscriptions:        "Subscriptions",
  transit:              "Transit",
  pharmacy:             "Pharmacy",
  onlineShopping:       "Online Shopping",
  homeImprovement:      "Home Improvement",
  canadianTirePartners: "Canadian Tire",
  foreignPurchases:     "Foreign Purchases",
  other:                "Other",
};

const REWARD_LABELS: Record<string, string> = {
  cashback: "Cash Back",
  points:   "Points / Travel",
  both:     "Cash Back & Points",
};

const FEE_LABELS: Record<string, string> = {
  no_fee:      "No annual fee",
  include_fee: "Open to annual fee",
};

const NETWORK_LABELS: Record<string, string> = {
  visa:       "Visa",
  mastercard: "Mastercard",
  amex:       "Amex",
};

function fmt(amount: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(amount);
}

export default function ExtractedDataSummary({ data, isDone, onFindCards, onManualEntry }: ExtractedDataSummaryProps) {
  const hasAnyData = data && (
    hasSpending(data) ||
    data.filters?.rewardType ||
    data.filters?.feePreference ||
    data.annualIncome ||
    data.estimatedCreditScore ||
    data.householdIncome ||
    data.filters?.rogersOwner != null ||
    data.filters?.amazonPrime != null ||
    data.filters?.institutions != null ||
    data.filters?.networks
  );

  return (
    <div className="mt-4 rounded-xl border border-[#DADCE0] bg-white px-4 py-4 dark:border-[#3C4043] dark:bg-[#2D2E30]">

      {/* Section header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[13px] font-semibold text-[#202124] dark:text-[#E8EAED]">Profile Summary</span>
        {isDone && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Complete
          </span>
        )}
      </div>

      {!hasAnyData ? (
        <p className="text-[12px] italic text-[#9AA0A6] dark:text-[#5F6368]">
          Your profile will build up here as we chat.
        </p>
      ) : (
        <div className="space-y-3 text-[12px] text-[#202124] dark:text-[#E8EAED]">

          {/* Spending */}
          {hasSpending(data!) && (
            <Section label="Spending">
              {Object.entries(data!.spending ?? {}).map(([key, val]) =>
                val != null && val > 0 ? (
                  <Bullet key={key} label={SPENDING_LABELS[key] ?? key} value={`${fmt(val)}/mo`} />
                ) : null
              )}
            </Section>
          )}

          {/* Preferences */}
          {(data!.filters?.rewardType || data!.filters?.feePreference || data!.annualIncome || data!.householdIncome || data!.estimatedCreditScore) && (
            <Section label="Preferences">
              {data!.filters?.rewardType && (
                <Bullet label="Rewards" value={REWARD_LABELS[data!.filters.rewardType] ?? data!.filters.rewardType} />
              )}
              {data!.filters?.feePreference && (
                <Bullet label="Annual fee" value={FEE_LABELS[data!.filters.feePreference] ?? data!.filters.feePreference} />
              )}
              {data!.annualIncome && (
                <Bullet label="Personal income" value={fmt(data!.annualIncome) + "/yr"} />
              )}
              {data!.householdIncome && (
                <Bullet label="Household income" value={fmt(data!.householdIncome) + "/yr"} />
              )}
              {data!.estimatedCreditScore && (
                <Bullet label="Credit score" value={creditScoreLabel(data!.estimatedCreditScore)} />
              )}
            </Section>
          )}

          {/* Brand affiliations */}
          {(data!.filters?.rogersOwner != null || data!.filters?.amazonPrime != null) && (
            <Section label="Brands">
              {data!.filters?.rogersOwner === true && <Bullet label="Rogers / Fido / Shaw" value="Yes" />}
              {data!.filters?.rogersOwner === false && <Bullet label="Rogers / Fido / Shaw" value="No" />}
              {data!.filters?.amazonPrime === true && <Bullet label="Amazon Prime" value="Yes" />}
              {data!.filters?.amazonPrime === false && <Bullet label="Amazon Prime" value="No" />}
            </Section>
          )}

          {/* Institutions */}
          {data!.filters?.institutions != null && (
            <Section label="Institutions">
              {data!.filters.institutions.length === 0 ? (
                <Bullet label="Preference" value="Any institution" />
              ) : (
                data!.filters.institutions.map(inst => (
                  <Bullet key={inst} label={inst} value="" />
                ))
              )}
            </Section>
          )}

          {/* Networks */}
          {data!.filters?.networks && (
            <Section label="Networks">
              <div className="flex flex-wrap gap-1 pl-2">
                {data!.filters.networks.map(net => (
                  <span key={net} className="rounded-full border border-[#DADCE0] px-2 py-0.5 text-[11px] font-medium text-[#5F6368] dark:border-[#3C4043] dark:text-[#9AA0A6]">
                    {NETWORK_LABELS[net] ?? net}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Benefits */}
          {hasBenefits(data!) && (
            <Section label="Benefits">
              {data!.filters?.benefits?.noForeignFee   === true && <Bullet label="No foreign transaction fee" value="" />}
              {data!.filters?.benefits?.airportLounge  === true && <Bullet label="Airport lounge access" value="" />}
              {data!.filters?.benefits?.priorityTravel === true && <Bullet label="Priority travel (NEXUS)" value="" />}
              {data!.filters?.benefits?.freeCheckedBag === true && <Bullet label="Free checked bag" value="" />}
            </Section>
          )}

        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-col gap-2">
        {isDone && (
          <button
            onClick={onFindCards}
            className="w-full rounded-lg bg-[#1A73E8] py-2.5 text-[13px] font-medium text-white transition hover:bg-[#1557B0] active:bg-[#0D47A1]"
          >
            Find Best Cards
          </button>
        )}
        <button
          onClick={onManualEntry}
          className="w-full text-center text-[12px] text-[#5F6368] underline underline-offset-2 hover:text-[#202124] dark:text-[#9AA0A6] dark:hover:text-[#E8EAED]"
        >
          Enter spending manually instead
        </button>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#9AA0A6] dark:text-[#5F6368]">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Bullet({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1 pl-2">
      <span className="text-[#9AA0A6] dark:text-[#5F6368]">•</span>
      <span className="text-[#202124] dark:text-[#E8EAED]">{label}</span>
      {value && (
        <>
          <span className="text-[#DADCE0] dark:text-[#3C4043]">·</span>
          <span className="font-medium text-[#1A73E8]">{value}</span>
        </>
      )}
    </div>
  );
}

function hasSpending(data: ExtractedData): boolean {
  if (!data.spending) return false;
  return Object.values(data.spending).some(v => v != null && v > 0);
}

function hasBenefits(data: ExtractedData): boolean {
  const b = data.filters?.benefits;
  if (!b) return false;
  return b.noForeignFee === true || b.airportLounge === true || b.priorityTravel === true || b.freeCheckedBag === true;
}

function creditScoreLabel(score: number): string {
  if (score >= 760) return `${score} (Excellent)`;
  if (score >= 700) return `${score} (Good)`;
  if (score >= 650) return `${score} (Fair)`;
  return `${score} (Building)`;
}
