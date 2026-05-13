"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, hydrateAuth } from "@/lib/store/auth";

export default function RootPage() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    hydrateAuth();
    // After hydration, userId will be set if localStorage had it
    const stored = localStorage.getItem("ff_userId");
    router.replace(stored ? "/discover" : "/login");
  }, [router]);

  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
