"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { useAuthStore, persistAuth } from "@/lib/store/auth";
import { Button } from "@/components/ui/button";

const SEED_USERS = [
  { id: "alice", label: "Alice Chen" },
  { id: "bob", label: "Bob Martinez" },
  { id: "carol", label: "Carol Kim" },
];

export default function LoginPage() {
  const router = useRouter();
  const setUserId = useAuthStore((s) => s.setUserId);
  const [selected, setSelected] = useState("alice");

  const handleLogin = () => {
    persistAuth(selected);
    setUserId(selected);
    router.replace("/discover");
  };

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-background px-6">
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary-end shadow-2xl">
          <MapPin className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          FriendsFinder
        </h1>
        <p className="text-sm text-muted">Find friends near you</p>
      </div>

      {/* Dev mode badge */}
      <div className="mb-8 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 text-xs font-medium text-yellow-400">
        Dev mode — pick a seed user
      </div>

      {/* User selector */}
      <div className="mb-6 w-full max-w-xs space-y-3">
        {SEED_USERS.map((user) => (
          <button
            key={user.id}
            onClick={() => setSelected(user.id)}
            className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all ${
              selected === user.id
                ? "border-primary/60 bg-primary/10 text-white"
                : "border-white/10 bg-surface text-muted hover:border-white/20 hover:text-white"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-primary-end/40 text-lg font-bold text-white">
              {user.label[0]}
            </div>
            <div>
              <p className="font-semibold">{user.label}</p>
              <p className="text-xs opacity-60">@{user.id}</p>
            </div>
            {selected === user.id && (
              <span className="ml-auto h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      <Button onClick={handleLogin} className="w-full max-w-xs text-base" size="lg">
        Continue as {SEED_USERS.find((u) => u.id === selected)?.label}
      </Button>
    </div>
  );
}
