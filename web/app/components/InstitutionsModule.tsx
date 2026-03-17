"use client";

import { useState } from "react";

/* ── Types ──────────────────────────────────────────────────────────────── */

export type InstitutionId = string;

interface InstitutionItem {
  id: InstitutionId;
  label: string;
}

// IDs must exactly match the `issuer` column values in the credit_cards table
// (see V2__seed_cards.sql). The backend does a direct string comparison.
const BIG_FIVE: InstitutionItem[] = [
  { id: "TD",                 label: "TD"         },
  { id: "RBC",                label: "RBC"        },
  { id: "BMO",                label: "BMO"        },
  { id: "Scotiabank",         label: "Scotiabank" },
  { id: "CIBC",               label: "CIBC"       },
];

const FINTECHS: InstitutionItem[] = [
  { id: "Wealthsimple",       label: "Wealthsimple" },
  { id: "Neo Financial",      label: "Neo Financial" },
  { id: "Tangerine",          label: "Tangerine"     },
  { id: "Simplii",            label: "Simplii"       },
  { id: "PC Financial",       label: "PC Financial"  },
  { id: "EQ Bank",            label: "EQ Bank"       },
  { id: "Rogers",             label: "Rogers"        },
];

const ALL_INSTITUTIONS = [...BIG_FIVE, ...FINTECHS];

interface InstitutionsModuleProps {
  onChange: (selected: InstitutionId[]) => void;
  initialSelected?: InstitutionId[];
}

/* ── Pill button ────────────────────────────────────────────────────────── */

function InstitutionPill({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-150 active:scale-[0.97] ${
        selected
          ? "bg-black text-white dark:bg-[#E8EAED] dark:text-[#202124]"
          : "border border-[#DADCE0] text-[#5F6368] hover:border-[#BDC1C6] hover:text-black dark:border-[#3C4043] dark:text-[#9AA0A6] dark:hover:border-[#5F6368] dark:hover:text-[#E8EAED]"
      }`}
    >
      {label}
    </button>
  );
}

/* ── InstitutionsModule ─────────────────────────────────────────────────── */

export default function InstitutionsModule({
  onChange,
  initialSelected = [],
}: InstitutionsModuleProps) {
  const [selected, setSelected] = useState<Set<InstitutionId>>(
    new Set(initialSelected)
  );

  function toggle(id: InstitutionId) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    onChange([...next]);
  }

  function selectAll() {
    const all = new Set(ALL_INSTITUTIONS.map((i) => i.id));
    setSelected(all);
    onChange([...all]);
  }

  function clearAll() {
    setSelected(new Set());
    onChange([]);
  }

  return (
    <div className="rounded-2xl border border-[#DADCE0] bg-white p-6 dark:border-[#3C4043] dark:bg-[#292A2D]">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-black dark:text-[#E8EAED]">
            Institutions
          </h2>
          <p className="mt-0.5 text-[12px] text-[#9AA0A6] dark:text-[#5F6368]">
            Show cards from banks you already use or are open to joining
          </p>
        </div>
        <div className="flex shrink-0 gap-3 pt-0.5">
          <button
            type="button"
            onClick={selectAll}
            className="text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] transition-colors duration-150 hover:text-black dark:text-[#5F6368] dark:hover:text-[#E8EAED]"
          >
            All
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] transition-colors duration-150 hover:text-black dark:text-[#5F6368] dark:hover:text-[#E8EAED]"
          >
            None
          </button>
        </div>
      </div>

      {/* Big Five */}
      <div className="mb-5">
        <p className="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
          Big Five
        </p>
        <div className="flex flex-wrap gap-2">
          {BIG_FIVE.map(({ id, label }) => (
            <InstitutionPill
              key={id}
              label={label}
              selected={selected.has(id)}
              onToggle={() => toggle(id)}
            />
          ))}
        </div>
      </div>

      {/* Fintechs */}
      <div>
        <p className="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
          Fintech &amp; Credit Unions
        </p>
        <div className="flex flex-wrap gap-2">
          {FINTECHS.map(({ id, label }) => (
            <InstitutionPill
              key={id}
              label={label}
              selected={selected.has(id)}
              onToggle={() => toggle(id)}
            />
          ))}
        </div>
      </div>

      {/* Selection count */}
      {selected.size > 0 && (
        <p className="mt-4 text-[11px] text-[#9AA0A6] dark:text-[#5F6368]">
          {selected.size} institution{selected.size !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
