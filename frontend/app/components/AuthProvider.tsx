"use client";

import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import type { ReactNode } from "react";

export default function AuthProvider({ children }: { children: ReactNode }) {
  return <Auth0Provider>{children}</Auth0Provider>;
}
