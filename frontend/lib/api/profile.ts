import { apiRequest } from "./client";
import type { UserProfile } from "@/lib/types";

export function fetchProfile(userId: string): Promise<UserProfile> {
  return apiRequest<UserProfile>(`/users/${userId}/profile`);
}

export function updateProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, "displayName" | "profilePictureKey" | "discoverable">>
): Promise<UserProfile> {
  return apiRequest<UserProfile>(`/users/${userId}/profile`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export function getProfilePictureUploadUrl(
  userId: string
): Promise<{ uploadUrl: string; key: string }> {
  return apiRequest<{ uploadUrl: string; key: string }>(
    `/users/${userId}/profile-picture-upload-url`
  );
}

export async function uploadProfilePicture(
  file: File,
  userId: string
): Promise<string> {
  const { uploadUrl, key } = await getProfilePictureUploadUrl(userId);
  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  return key;
}
