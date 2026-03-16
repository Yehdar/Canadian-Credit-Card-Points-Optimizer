"use client";

import { useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import type { ProfileType, SpendingBreakdown } from "@/lib/api";

const PROFILE_TYPES: { value: ProfileType; label: string }[] = [
  { value: "personal", label: "Personal"  },
  { value: "business", label: "Business"  },
  { value: "partner",  label: "Partner"   },
];

const DEFAULT_SPENDING: SpendingBreakdown = {
  groceries: 0, dining: 0, gas: 0, travel: 0,
  entertainment: 0, subscriptions: 0, transit: 0, other: 0,
};

export default function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfile, createProfile, removeProfile } = useProfile();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName]         = useState("");
  const [newType, setNewType]         = useState<ProfileType>("personal");
  const [isCreating, setIsCreating]   = useState(false);

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

  if (profiles.length === 0 && !showNewForm) {
    return (
      <div className="mb-8 flex items-center justify-between">
        <p className="text-[13px] text-[#A8A8A8] dark:text-[#555555]">No profiles — results won't be saved.</p>
        <button
          onClick={() => setShowNewForm(true)}
          className="text-[13px] font-medium text-black underline underline-offset-2 decoration-[#EBEBEB] hover:decoration-black transition-all duration-200 dark:text-[#EDEDED] dark:decoration-[#1F1F1F] dark:hover:decoration-[#EDEDED]"
        >
          Create profile
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Tab row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Profile pills */}
        {profiles.map((profile) => {
          const isActive = activeProfile?.id === profile.id;
          return (
            <button
              key={profile.id}
              onClick={() => setActiveProfile(profile)}
              className={`group relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-black text-white dark:bg-[#EDEDED] dark:text-[#0A0A0A]"
                  : "bg-transparent text-[#6B6B6B] hover:bg-[#F2F2F2] hover:text-black dark:text-[#888888] dark:hover:bg-[#1F1F1F] dark:hover:text-[#EDEDED]"
              }`}
            >
              {profile.name}
              <span
                role="button"
                aria-label="Delete profile"
                onClick={(e) => handleDelete(e, profile.id)}
                className={`-mr-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] leading-none opacity-0 transition-opacity group-hover:opacity-100 ${
                  isActive
                    ? "text-white hover:bg-black/20 dark:text-[#0A0A0A] dark:hover:bg-white/20"
                    : "text-[#6B6B6B] hover:bg-black/10 dark:text-[#888888] dark:hover:bg-white/10"
                }`}
              >
                ×
              </span>
            </button>
          );
        })}

        {/* Divider when pills exist */}
        {profiles.length > 0 && (
          <div className="mx-1 h-4 w-px bg-[#EBEBEB] dark:bg-[#1F1F1F]" />
        )}

        {/* New / Cancel toggle */}
        <button
          onClick={() => setShowNewForm((v) => !v)}
          className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-all duration-200 ${
            showNewForm
              ? "bg-[#F2F2F2] text-black dark:bg-[#1F1F1F] dark:text-[#EDEDED]"
              : "text-[#A8A8A8] hover:bg-[#F2F2F2] hover:text-black dark:text-[#555555] dark:hover:bg-[#1F1F1F] dark:hover:text-[#EDEDED]"
          }`}
        >
          {showNewForm ? "Cancel" : "+ New"}
        </button>
      </div>

      {/* New profile inline form */}
      {showNewForm && (
        <form
          onSubmit={handleCreate}
          className="mt-4 flex flex-wrap items-end gap-3 border-t border-[#EBEBEB] pt-4 dark:border-[#1F1F1F]"
        >
          <div className="min-w-[200px] flex-1">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-[#A8A8A8] dark:text-[#555555]">
              Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. My Household"
              maxLength={100}
              required
              className="w-full rounded-xl border border-[#EBEBEB] bg-white px-4 py-2.5 text-[13px] text-black placeholder:text-[#C0C0C0] focus:border-black focus:outline-none transition-colors duration-150 dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#EDEDED] dark:placeholder:text-[#333333] dark:focus:border-[#EDEDED]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-[#A8A8A8] dark:text-[#555555]">
              Type
            </label>
            <div className="flex gap-1.5">
              {PROFILE_TYPES.map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center rounded-full px-3.5 py-2 text-[12px] font-medium transition-all duration-200 ${
                    newType === value
                      ? "bg-black text-white dark:bg-[#EDEDED] dark:text-[#0A0A0A]"
                      : "border border-[#EBEBEB] text-[#6B6B6B] hover:border-black hover:text-black dark:border-[#1F1F1F] dark:text-[#888888] dark:hover:border-[#EDEDED] dark:hover:text-[#EDEDED]"
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
                  {label}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreating || !newName.trim()}
            className="rounded-full bg-black px-6 py-2.5 text-[13px] font-medium text-white transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#EDEDED] dark:text-[#0A0A0A]"
          >
            {isCreating ? "Creating…" : "Create"}
          </button>
        </form>
      )}
    </div>
  );
}
