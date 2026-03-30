"use client";

import { useState } from "react";

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface Bonuses {
  rogersOwner: boolean;
  amazonPrime: boolean;
}

interface BonusesModuleProps {
  onChange: (bonuses: Bonuses) => void;
  initialBonuses?: Partial<Bonuses>;
}

/* ── Monochromatic brand SVGs ───────────────────────────────────────────── */

function RogersLogo() {
  return (
    <svg viewBox="0 0 68 18" className="h-[14px] w-auto" aria-label="Rogers">
      <text
        x="0"
        y="14"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fontSize="14"
        fill="currentColor"
        letterSpacing="0.3"
      >
        Rogers
      </text>
    </svg>
  );
}

function AmazonLogo() {
  return (
    <svg viewBox="0 0 72 22" className="h-[14px] w-auto" aria-label="Amazon">
      <text
        x="0"
        y="14"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fontSize="14"
        fill="currentColor"
        letterSpacing="0.2"
      >
        amazon
      </text>
      {/* Smile arrow */}
      <path
        d="M3 18 Q25 24 48 18"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M44 16 L48 18 L44 20"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Bonus option config ────────────────────────────────────────────────── */
/* Store component references, not rendered elements, to avoid module-level  */
/* JSX which triggers React dev-mode warnings.                                */

const BONUS_OPTIONS: {
  key: keyof Bonuses;
  label: string;
  sublabel: string;
  Logo: () => React.ReactElement;
}[] = [
  {
    key: "rogersOwner",
    label: "Primary Rogers / Fido / Shaw / Comwave owner",
    sublabel: "Unlocks Rogers World Elite Mastercard 3% unlimited cash back on all purchases",
    Logo: RogersLogo,
  },
  {
    key: "amazonPrime",
    label: "Amazon Prime Member",
    sublabel: "Unlocks elevated earn rates on Amazon.ca and Prime Video purchases",
    Logo: AmazonLogo,
  },
];

/* ── BonusesModule ──────────────────────────────────────────────────────── */

export default function BonusesModule({
  onChange,
  initialBonuses = {},
}: BonusesModuleProps) {
  const [bonuses, setBonuses] = useState<Bonuses>({
    rogersOwner: initialBonuses.rogersOwner ?? false,
    amazonPrime: initialBonuses.amazonPrime ?? false,
  });

  function toggle(key: keyof Bonuses) {
    const next = { ...bonuses, [key]: !bonuses[key] };
    setBonuses(next);
    onChange(next);
  }

  return (
    <div className="rounded-2xl border border-[#DADCE0] bg-white p-6 dark:border-[#3C4043] dark:bg-[#292A2D]">
      <div className="mb-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-black dark:text-[#E8EAED]">
          Bonus Multipliers
        </h2>
        <p className="mt-0.5 text-[12px] text-[#9AA0A6] dark:text-[#5F6368]">
          Unlock elevated earn rates based on your existing services
        </p>
      </div>

      <div className="space-y-3">
        {BONUS_OPTIONS.map(({ key, label, sublabel, Logo }) => {
          const checked = bonuses[key];
          return (
            <div
              key={key}
              role="checkbox"
              aria-checked={checked}
              tabIndex={0}
              onClick={() => toggle(key)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  toggle(key);
                }
              }}
              className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors duration-150 ${
                checked
                  ? "border-black bg-black/[0.03] dark:border-[#E8EAED] dark:bg-[#E8EAED]/[0.05]"
                  : "border-[#DADCE0] hover:border-[#BDC1C6] dark:border-[#3C4043] dark:hover:border-[#5F6368]"
              }`}
            >
              {/* Custom checkbox indicator */}
              <div
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-150 ${
                  checked
                    ? "border-black bg-black dark:border-[#E8EAED] dark:bg-[#E8EAED]"
                    : "border-[#DADCE0] bg-white dark:border-[#5F6368] dark:bg-[#292A2D]"
                }`}
              >
                {checked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="dark:stroke-[#202124]"
                    />
                  </svg>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {/* Brand logo */}
                <span
                  className={`mb-1.5 block transition-colors duration-150 ${
                    checked
                      ? "text-black dark:text-[#E8EAED]"
                      : "text-[#9AA0A6] dark:text-[#5F6368]"
                  }`}
                >
                  <Logo />
                </span>
                <p className="text-[13px] font-medium text-black dark:text-[#E8EAED]">
                  {label}
                </p>
                <p className="mt-0.5 text-[11px] text-[#9AA0A6] dark:text-[#5F6368]">
                  {sublabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
