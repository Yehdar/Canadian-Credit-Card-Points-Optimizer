"use client";

import { useState } from "react";
import {
  Utensils,
  ShoppingCart,
  RefreshCw,
  Fuel,
  Bus,
  Tv,
  Globe,
  Plane,
  Pill,
  Package,
  Hammer,
  Wrench,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SpendingBreakdown } from "@/lib/api";

/* ── Types ──────────────────────────────────────────────────────────────── */

type Period = "monthly" | "yearly";

interface CategoryConfig {
  key: string;
  label: string;
  sublabel: string;
  Icon: LucideIcon;
  mapsTo: keyof SpendingBreakdown;
}

/* ── Category definitions (13 categories) ──────────────────────────────── */
/* Store the component reference, not a rendered element, to avoid           */
/* module-level JSX which triggers React dev-mode warnings.                  */

const CATEGORIES: CategoryConfig[] = [
  { key: "food",       label: "Food",                  sublabel: "Restaurants, bars, delivery",         Icon: Utensils,     mapsTo: "dining"                },
  { key: "grocery",    label: "Grocery",               sublabel: "Supermarkets, warehouse stores",       Icon: ShoppingCart, mapsTo: "groceries"             },
  { key: "recurring",  label: "Recurring",             sublabel: "Streaming, software, memberships",    Icon: RefreshCw,    mapsTo: "subscriptions"         },
  { key: "gas",        label: "Gas",                   sublabel: "Fuel stations",                        Icon: Fuel,         mapsTo: "gas"                   },
  { key: "transport",  label: "Transportation",        sublabel: "Taxis, rideshare, parking",            Icon: Bus,          mapsTo: "transit"               },
  { key: "entertain",  label: "Entertainment",         sublabel: "Events, movies, concerts",             Icon: Tv,           mapsTo: "entertainment"         },
  { key: "foreign",    label: "Foreign",               sublabel: "Non-CAD purchases abroad",             Icon: Globe,        mapsTo: "foreignPurchases"      },
  { key: "travel",     label: "Travel",                sublabel: "Flights, hotels, car rentals",         Icon: Plane,        mapsTo: "travel"                },
  { key: "pharmacy",   label: "Pharmacy",              sublabel: "Drugstores, medical supplies",         Icon: Pill,         mapsTo: "pharmacy"              },
  { key: "online",     label: "Online Shopping",       sublabel: "E-commerce, Amazon, eBay",             Icon: Package,      mapsTo: "onlineShopping"        },
  { key: "home",       label: "Home Improvement",      sublabel: "Hardware, furniture, appliances",      Icon: Hammer,       mapsTo: "homeImprovement"       },
  { key: "ctPartners", label: "Canadian Tire Partners",sublabel: "CT, Sport Chek, Mark's, Gas+",         Icon: Wrench,       mapsTo: "canadianTirePartners"  },
  { key: "other",      label: "Other",                 sublabel: "Everything else",                      Icon: Tag,          mapsTo: "other"                 },
];

type CategoryValues = Record<string, { value: number; period: Period }>;

function toAnnual(value: number, period: Period): number {
  return period === "monthly" ? value * 12 : value;
}

function normalizeToSpending(values: CategoryValues): SpendingBreakdown {
  const result: SpendingBreakdown = {
    groceries: 0, dining: 0, gas: 0, travel: 0,
    entertainment: 0, subscriptions: 0, transit: 0, other: 0,
    pharmacy: 0, onlineShopping: 0, homeImprovement: 0,
    canadianTirePartners: 0, foreignPurchases: 0,
  };
  CATEGORIES.forEach(({ key, mapsTo }) => {
    const entry = values[key];
    if (entry) result[mapsTo] += toAnnual(entry.value, entry.period);
  });
  return result;
}

/* ── CategoryCard sub-component ────────────────────────────────────────── */

function CategoryCard({
  config,
  value,
  period,
  onValueChange,
  onPeriodChange,
}: {
  config: CategoryConfig;
  value: number;
  period: Period;
  onValueChange: (v: number) => void;
  onPeriodChange: (p: Period) => void;
}) {
  const annualPreview = value > 0 ? toAnnual(value, period) : null;

  return (
    <div className="rounded-2xl border border-[#DADCE0] bg-white p-4 dark:border-[#3C4043] dark:bg-[#292A2D]">
      {/* Card header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F1F3F4] text-[#5F6368] dark:bg-[#202124] dark:text-[#9AA0A6]">
            <config.Icon size={15} />
          </span>
          <div>
            <p className="text-[13px] font-semibold leading-tight text-black dark:text-[#E8EAED]">
              {config.label}
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-[#9AA0A6] dark:text-[#5F6368]">
              {config.sublabel}
            </p>
          </div>
        </div>

        {/* Period toggle */}
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-[#DADCE0] dark:border-[#3C4043]">
          {(["monthly", "yearly"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={`px-2 py-1 text-[10px] font-medium uppercase tracking-wide transition-colors duration-100 ${
                period === p
                  ? "bg-black text-white dark:bg-[#E8EAED] dark:text-[#202124]"
                  : "bg-white text-[#9AA0A6] hover:text-black dark:bg-[#292A2D] dark:text-[#5F6368] dark:hover:text-[#E8EAED]"
              }`}
            >
              {p === "monthly" ? "Mo" : "Yr"}
            </button>
          ))}
        </div>
      </div>

      {/* Dollar input */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[13px] text-[#BDC1C6] dark:text-[#5F6368]">
          $
        </span>
        <input
          type="number"
          min="0"
          step="1"
          value={value || ""}
          onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="w-full rounded-xl border border-[#DADCE0] bg-[#F8F9FA] py-2.5 pl-7 pr-3 text-[14px] text-black placeholder:text-[#BDC1C6] transition-all duration-150 focus:border-black focus:bg-white focus:outline-none dark:border-[#3C4043] dark:bg-[#202124] dark:text-[#E8EAED] dark:placeholder:text-[#5F6368] dark:focus:border-[#E8EAED] dark:focus:bg-[#292A2D]"
        />
      </div>

      {/* Annual preview */}
      {annualPreview !== null && period === "monthly" && (
        <p className="mt-1.5 text-right text-[11px] text-[#9AA0A6] dark:text-[#5F6368]">
          = ${annualPreview.toLocaleString("en-CA")} / yr
        </p>
      )}
    </div>
  );
}

/* ── SpendingModule ─────────────────────────────────────────────────────── */

interface SpendingModuleProps {
  onChange: (spending: SpendingBreakdown) => void;
  initialValues?: Partial<Record<string, number>>;
}

export default function SpendingModule({
  onChange,
  initialValues = {},
}: SpendingModuleProps) {
  const [values, setValues] = useState<CategoryValues>(() =>
    Object.fromEntries(
      CATEGORIES.map(({ key }) => [
        key,
        { value: initialValues[key] ?? 0, period: "monthly" as Period },
      ])
    )
  );

  function updateValue(key: string, value: number) {
    const next = { ...values, [key]: { ...values[key], value } };
    setValues(next);
    onChange(normalizeToSpending(next));
  }

  function updatePeriod(key: string, period: Period) {
    const next = { ...values, [key]: { ...values[key], period } };
    setValues(next);
    onChange(normalizeToSpending(next));
  }

  return (
    <div className="rounded-2xl border border-[#DADCE0] bg-white p-6 dark:border-[#3C4043] dark:bg-[#292A2D]">
      <div className="mb-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-black dark:text-[#E8EAED]">
          Spending
        </h2>
        <p className="mt-0.5 text-[12px] text-[#9AA0A6] dark:text-[#5F6368]">
          Toggle each card between monthly or yearly — values are annualized before matching
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CATEGORIES.map((config) => (
          <CategoryCard
            key={config.key}
            config={config}
            value={values[config.key].value}
            period={values[config.key].period}
            onValueChange={(v) => updateValue(config.key, v)}
            onPeriodChange={(p) => updatePeriod(config.key, p)}
          />
        ))}
      </div>
    </div>
  );
}
