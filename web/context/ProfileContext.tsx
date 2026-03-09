"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  createProfile as apiCreate,
  deleteProfile as apiDelete,
  fetchProfiles,
  updateProfile as apiUpdate,
  type CreateProfilePayload,
  type Profile,
  type ProfileType,
  type SpendingBreakdown,
} from "@/lib/api";

interface ProfileContextValue {
  profiles: Profile[];
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile | null) => void;
  createProfile: (name: string, type: ProfileType, spending: SpendingBreakdown) => Promise<void>;
  saveActiveProfileSpending: (spending: SpendingBreakdown) => Promise<void>;
  removeProfile: (id: number) => Promise<void>;
  isLoadingProfiles: boolean;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

  useEffect(() => {
    fetchProfiles()
      .then((data) => {
        setProfiles(data);
        // Auto-select the first profile if one exists
        if (data.length > 0) setActiveProfile(data[0]);
      })
      .catch(console.error)
      .finally(() => setIsLoadingProfiles(false));
  }, []);

  const createProfile = useCallback(
    async (name: string, type: ProfileType, spending: SpendingBreakdown) => {
      const payload: CreateProfilePayload = { name, profileType: type, spending };
      const created = await apiCreate(payload);
      setProfiles((prev) => [created, ...prev]);
      setActiveProfile(created);
    },
    []
  );

  const saveActiveProfileSpending = useCallback(
    async (spending: SpendingBreakdown) => {
      if (!activeProfile) return;
      const updated = await apiUpdate(activeProfile.id, { spending });
      setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setActiveProfile(updated);
    },
    [activeProfile]
  );

  const removeProfile = useCallback(
    async (id: number) => {
      await apiDelete(id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      setActiveProfile((prev) => {
        if (prev?.id !== id) return prev;
        const remaining = profiles.filter((p) => p.id !== id);
        return remaining[0] ?? null;
      });
    },
    [profiles]
  );

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        setActiveProfile,
        createProfile,
        saveActiveProfileSpending,
        removeProfile,
        isLoadingProfiles,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
