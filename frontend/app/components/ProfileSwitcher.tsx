"use client";

import { useEffect, useRef, useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import type { ProfileType, SpendingBreakdown } from "@/lib/api";

const PROFILE_TYPES: { value: ProfileType; label: string }[] = [
  { value: "personal", label: "Personal" },
  { value: "business", label: "Business" },
  { value: "partner",  label: "Partner"  },
];

const DEFAULT_SPENDING: SpendingBreakdown = {
  groceries: 0, dining: 0, gas: 0, travel: 0,
  entertainment: 0, subscriptions: 0, transit: 0, other: 0,
  pharmacy: 0, onlineShopping: 0, homeImprovement: 0,
  canadianTirePartners: 0, foreignPurchases: 0,
};

type DropdownView = "list" | "create";

export default function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfile, createProfile, removeProfile } = useProfile();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [view, setView]                 = useState<DropdownView>("list");
  const [newName, setNewName]           = useState("");
  const [newType, setNewType]           = useState<ProfileType>("personal");
  const [isCreating, setIsCreating]     = useState(false);
  const dropdownRef                     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Reset create form when dropdown closes
  useEffect(() => {
    if (!dropdownOpen) {
      setView("list");
      setNewName("");
      setNewType("personal");
    }
  }, [dropdownOpen]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      await createProfile(newName.trim(), newType, DEFAULT_SPENDING);
      setDropdownOpen(false);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    await removeProfile(id);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setDropdownOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-black px-4 py-1.5 text-[13px] font-medium text-white transition-all duration-200 dark:bg-[#E8EAED] dark:text-[#202124]"
      >
        <span>{activeProfile?.name ?? "No profile"}</span>
        <svg
          className={`h-3 w-3 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
          viewBox="0 0 12 12" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="2 4 6 8 10 4" />
        </svg>
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-2xl border border-[#DADCE0] bg-white shadow-lg dark:border-[#3C4043] dark:bg-[#292A2D]">

          {view === "list" ? (
            <>
              {profiles.length === 0 ? (
                <p className="px-4 py-3 text-[12px] text-[#9AA0A6] dark:text-[#5F6368]">No profiles yet</p>
              ) : (
                profiles.map((profile) => {
                  const isActive = activeProfile?.id === profile.id;
                  return (
                    <button
                      key={profile.id}
                      onClick={() => { setActiveProfile(profile); setDropdownOpen(false); }}
                      className="group flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] transition-colors duration-150 hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043]"
                    >
                      <span className={isActive ? "font-semibold text-black dark:text-[#E8EAED]" : "text-[#5F6368] dark:text-[#9AA0A6]"}>
                        {profile.name}
                      </span>
                      <span
                        role="button"
                        aria-label="Delete profile"
                        onClick={(e) => handleDelete(e, profile.id)}
                        className="ml-3 flex h-4 w-4 items-center justify-center rounded-full text-[11px] leading-none text-[#9AA0A6] opacity-0 transition-all duration-150 hover:bg-black/10 hover:text-black group-hover:opacity-100 dark:text-[#5F6368] dark:hover:bg-white/10 dark:hover:text-[#E8EAED]"
                      >
                        ×
                      </span>
                    </button>
                  );
                })
              )}
              <div className="border-t border-[#DADCE0] dark:border-[#3C4043]" />
              <button
                onClick={() => setView("create")}
                className="flex w-full items-center gap-1.5 px-4 py-2.5 text-[13px] text-[#9AA0A6] transition-colors duration-150 hover:bg-[#F1F3F4] hover:text-black dark:text-[#5F6368] dark:hover:bg-[#3C4043] dark:hover:text-[#E8EAED]"
              >
                + New profile
              </button>
            </>
          ) : (
            <form onSubmit={handleCreate} className="p-4">
              {/* Back header */}
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[#9AA0A6] transition hover:bg-[#F1F3F4] hover:text-black dark:text-[#5F6368] dark:hover:bg-[#3C4043] dark:hover:text-[#E8EAED]"
                >
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="8 2 4 6 8 10" />
                  </svg>
                </button>
                <span className="text-[12px] font-semibold text-black dark:text-[#E8EAED]">New profile</span>
              </div>

              {/* Name */}
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. My Household"
                maxLength={100}
                required
                autoFocus
                className="mb-3 w-full rounded-lg border border-[#DADCE0] bg-[#F8F9FA] px-3 py-2 text-[13px] text-black placeholder:text-[#BDC1C6] focus:border-black focus:outline-none transition-colors dark:border-[#3C4043] dark:bg-[#202124] dark:text-[#E8EAED] dark:placeholder:text-[#5F6368] dark:focus:border-[#E8EAED]"
              />

              {/* Type pills */}
              <div className="mb-4 flex gap-1.5">
                {PROFILE_TYPES.map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex flex-1 cursor-pointer items-center justify-center rounded-full py-1.5 text-[11px] font-medium transition-all duration-200 ${
                      newType === value
                        ? "bg-black text-white dark:bg-[#E8EAED] dark:text-[#202124]"
                        : "border border-[#DADCE0] text-[#5F6368] hover:border-black hover:text-black dark:border-[#3C4043] dark:text-[#9AA0A6] dark:hover:border-[#E8EAED] dark:hover:text-[#E8EAED]"
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

              <button
                type="submit"
                disabled={isCreating || !newName.trim()}
                className="w-full rounded-full bg-black py-2 text-[13px] font-medium text-white transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#E8EAED] dark:text-[#202124]"
              >
                {isCreating ? "Creating…" : "Create"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
