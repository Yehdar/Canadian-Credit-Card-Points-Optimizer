"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import Image from "next/image";

export default function AuthButtons() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="h-7 w-20 animate-pulse rounded-full bg-[#F1F3F4] dark:bg-[#3C4043]" />
    );
  }

  if (!user) {
    return (
      <a
        href="/auth/login"
            className="animate-pulse-glow rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold text-gray-900 transition-all hover:brightness-110 hover:scale-[1.03] active:scale-[0.98]"

      >
        Sign In
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {user.picture && (
        <Image
          src={user.picture}
          alt={user.name ?? "Profile"}
          width={28}
          height={28}
          className="rounded-full ring-1 ring-black/10 dark:ring-white/20"
        />
      )}
      <span className="hidden text-[13px] font-medium text-[#3C4043] dark:text-[#E8EAED] sm:block">
        {user.given_name ?? user.name}
      </span>
      <a
        href="/auth/logout"
        className="rounded-full border border-[#DADCE0] px-3 py-1 text-[12px] font-medium text-[#3C4043] transition-colors hover:bg-[#F1F3F4] dark:border-[#3C4043] dark:text-[#E8EAED] dark:hover:bg-[#3C4043]"
      >
        Sign out
      </a>
    </div>
  );
}
