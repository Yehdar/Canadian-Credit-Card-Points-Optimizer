"use client";

import { useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import type { ProfileType, SpendingBreakdown } from "@/lib/api";

const PROFILE_TYPES: { value: ProfileType; label: string; emoji: string }[] = [
  { value: "personal", label: "Personal",  emoji: "👤" },
  { value: "business", label: "Business",  emoji: "💼" },
  { value: "partner",  label: "Partner",   emoji: "👥" },
];

interface SaveProfilePromptProps {
  spending: SpendingBreakdown;
  /** Called after a successful save so the parent can react (e.g. clear the prompt). */
  onSaved?: () => void;
}

export default function SaveProfilePrompt({ spending, onSaved }: SaveProfilePromptProps) {
  const { createProfile } = useProfile();

  const [name, setName]       = useState("");
  const [type, setType]       = useState<ProfileType>("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

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
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
        <span>✓</span>
        <span>Profile saved! Switch to it anytime from the profile bar above.</span>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Save this spending profile
      </h3>
      <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
        Store these numbers for future comparisons and household optimization.
      </p>

      <form onSubmit={handleSave} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Profile name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Household"
            maxLength={100}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Type
          </label>
          <div className="flex gap-1.5">
            {PROFILE_TYPES.map(({ value, label, emoji }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  type === value
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
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
                {emoji} {label}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving || !name.trim()}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
