"use client";

import { useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import type { ProfileType, SpendingBreakdown } from "@/lib/api";

const PROFILE_TYPES: { value: ProfileType; label: string }[] = [
  { value: "personal", label: "Personal" },
  { value: "business", label: "Business" },
  { value: "partner",  label: "Partner"  },
];

interface SaveProfilePromptProps {
  spending: SpendingBreakdown;
  onSaved?: () => void;
}

export default function SaveProfilePrompt({ spending, onSaved }: SaveProfilePromptProps) {
  const { createProfile } = useProfile();

  const [name, setName]         = useState("");
  const [type, setType]         = useState<ProfileType>("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await createProfile(name.trim(), type, spending);
      setSaved(true);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[#DADCE0] bg-[#F1F3F4] px-4 py-3 text-[13px] text-black dark:border-[#3C4043] dark:bg-[#292A2D] dark:text-[#E8EAED]">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
          <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Profile saved — switch to it anytime from the profile bar.</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#DADCE0] bg-white p-6 dark:border-[#3C4043] dark:bg-[#292A2D]">
      <h3 className="text-[15px] font-semibold tracking-tight text-black dark:text-[#E8EAED]">
        Save this spending profile
      </h3>
      <p className="mt-0.5 text-[12px] text-[#9AA0A6] dark:text-[#5F6368]">
        Store these numbers for future comparisons and household optimization.
      </p>

      <form onSubmit={handleSave} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
            Profile name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Household"
            maxLength={100}
            required
            className="w-full rounded-xl border border-[#DADCE0] bg-[#F8F9FA] px-4 py-2.5 text-[13px] text-black placeholder:text-[#BDC1C6] transition-colors duration-150 focus:border-black focus:bg-white focus:outline-none dark:border-[#3C4043] dark:bg-[#202124] dark:text-[#E8EAED] dark:placeholder:text-[#5F6368] dark:focus:border-[#E8EAED] dark:focus:bg-[#292A2D]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-[#9AA0A6] dark:text-[#5F6368]">
            Type
          </label>
          <div className="flex gap-1.5">
            {PROFILE_TYPES.map(({ value, label }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center rounded-full px-3.5 py-2 text-[12px] font-medium transition-all duration-200 ${
                  type === value
                    ? "bg-black text-white dark:bg-[#E8EAED] dark:text-[#202124]"
                    : "border border-[#DADCE0] text-[#5F6368] hover:border-black hover:text-black dark:border-[#3C4043] dark:text-[#9AA0A6] dark:hover:border-[#E8EAED] dark:hover:text-[#E8EAED]"
                }`}
              >
                <input
                  type="radio"
                  name="saveProfileType"
                  value={value}
                  checked={type === value}
                  onChange={() => setType(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving || !name.trim()}
          className="rounded-full bg-black px-6 py-2.5 text-[13px] font-semibold text-white transition-all duration-150 active:scale-[0.97] hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#E8EAED] dark:text-[#202124]"
        >
          {isSaving ? "Saving…" : "Save Profile"}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-[12px] text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
