"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchProfile } from "@/lib/api/profile";
import { useAuthStore, clearAuth } from "@/lib/store/auth";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function ProfilePage() {
  const userId = useAuthStore((s) => s.userId)!;
  const router = useRouter();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId),
    enabled: !!userId,
  });

  const handleSignOut = () => {
    clearAuth();
    router.replace("/login");
  };

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="flex items-center justify-between px-2">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-muted hover:text-danger gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-6 px-2">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ) : profile ? (
        <ProfileForm profile={profile} />
      ) : (
        <p className="text-center text-muted">Failed to load profile</p>
      )}
    </div>
  );
}
