"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "@/lib/api/profile";
import { useAuthStore } from "@/lib/store/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AvatarUploader } from "./AvatarUploader";
import { DiscoverableToggle } from "./DiscoverableToggle";
import { toast } from "sonner";
import type { UserProfile } from "@/lib/types";

interface Props {
  profile: UserProfile;
}

export function ProfileForm({ profile }: Props) {
  const userId = useAuthStore((s) => s.userId)!;
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [discoverable, setDiscoverable] = useState(profile.discoverable);

  const mutation = useMutation({
    mutationFn: () =>
      updateProfile(userId, { displayName, discoverable }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile", userId], updated);
      toast.success("Profile saved");
    },
    onError: () => toast.error("Failed to save profile"),
  });

  const handleUpload = async (key: string) => {
    try {
      const updated = await updateProfile(userId, { profilePictureKey: key });
      queryClient.setQueryData(["profile", userId], updated);
    } catch {
      toast.error("Failed to link photo to profile");
    }
  };

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-6">
      <AvatarUploader
        currentUrl={profile.profilePictureUrl}
        initials={initials}
        onUploadComplete={handleUpload}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          maxLength={50}
        />
      </div>

      <DiscoverableToggle
        checked={discoverable}
        onCheckedChange={setDiscoverable}
      />

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !displayName.trim()}
        className="w-full"
      >
        {mutation.isPending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
