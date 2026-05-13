"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { useAuthStore, hydrateAuth } from "@/lib/store/auth";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { WSProvider } from "@/components/providers/WSProvider";
import { BottomTabBar } from "@/components/nav/BottomTabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    hydrateAuth();
  }, []);

  useEffect(() => {
    if (userId === null) {
      const stored = localStorage.getItem("ff_userId");
      if (!stored) {
        router.replace("/login");
      }
    }
  }, [userId, router]);

  // Don't render children until we know the user
  if (!userId && typeof window !== "undefined" && !localStorage.getItem("ff_userId")) {
    return null;
  }

  return (
    <QueryProvider>
      <WSProvider>
        <div
          className="mx-auto flex flex-col bg-background"
          style={{ height: "100dvh", maxWidth: "480px" }}
        >
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
          <BottomTabBar />
        </div>
        <Toaster position="top-center" richColors closeButton />
      </WSProvider>
    </QueryProvider>
  );
}
