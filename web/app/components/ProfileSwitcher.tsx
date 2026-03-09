"use client";

import { useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import type { ProfileType, SpendingBreakdown } from "@/lib/api";

const PROFILE_TYPES: { value: ProfileType; label: string; emoji: string }[] = [
  { value: "personal",  label: "Personal",  emoji: "👤" },
  { value: "business",  label: "Business",  emoji: "💼" },
  { value: "partner",   label: "Partner",   emoji: "👥" },
];

const DEFAULT_SPENDING: SpendingBreakdown = {
  groceries: 0, dining: 0, gas: 0, travel: 0,
  entertainment: 0, subscriptions: 0, transit: 0, other: 0,
};

export default function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfile, createProfile, removeProfile } = useProfile();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<ProfileType>("personal");
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      await createProfile(newName.trim(), newType, DEFAULT_SPENDING);
      setNewName("");
      setNewType("personal");
      setShowNewForm(false);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    await removeProfile(id);
  }

  return (
    <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
          Spending Profiles
        </h2>
        <button
          onClick={() => setShowNewForm((v) => !v)}
          className="rounded-lg px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950 transition-colors"
        >
          {showNewForm ? "Cancel" : "+ New Profile"}
        </button>
      </div>

      {/* Profile pills */}
      <div className="flex flex-wrap gap-2">
        {profiles.length === 0 && !showNewForm && (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            No profiles yet — create one to save your spending.
          </p>
        )}
        {profiles.map((profile) => {
          const typeInfo = PROFILE_TYPES.find((t) => t.value === profile.profileType);
          const isActive = activeProfile?.id === profile.id;
          return (
            <button
              key={profile.id}
              onClick={() => setActiveProfile(profile)}
              className={`group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              <span>{typeInfo?.emoji}</span>
              <span>{profile.name}</span>
              <span
                role="button"
                onClick={(e) => handleDelete(e, profile.id)}
                className={`ml-1 rounded-full text-xs leading-none transition-opacity opacity-0 group-hover:opacity-100 ${
                  isActive ? "hover:text-blue-200" : "hover:text-red-500"
                }`}
                title="Delete profile"
              >
                ×
              </span>
            </button>
          );
        })}
      </div>

      {/* New profile form */}
      {showNewForm && (
        <form
          onSubmit={handleCreate}
          className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800"
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Profile name (e.g. My Household)"
              maxLength={100}
              required
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {PROFILE_TYPES.map(({ value, label, emoji }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  newType === value
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name="profileType"
                  value={value}
                  checked={newType === value}
                  onChange={() => setNewType(value)}
                  className="sr-only"
                />
                {emoji} {label}
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={isCreating || !newName.trim()}
            className="self-start rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create Profile"}
          </button>
        </form>
      )}
    </div>
  );
}
