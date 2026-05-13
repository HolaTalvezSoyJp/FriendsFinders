"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { uploadProfilePicture } from "@/lib/api/profile";
import { useAuthStore } from "@/lib/store/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  currentUrl?: string;
  initials: string;
  onUploadComplete: (key: string) => void;
}

export function AvatarUploader({ currentUrl, initials, onUploadComplete }: Props) {
  const userId = useAuthStore((s) => s.userId)!;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are allowed");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image must be under 5 MB");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const key = await uploadProfilePicture(file, userId);
      onUploadComplete(key);
      toast.success("Photo updated");
    } catch {
      toast.error("Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative cursor-pointer"
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <Avatar className="h-24 w-24">
          <AvatarImage src={preview ?? currentUrl} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg">
          <Camera className="h-4 w-4 text-white" />
        </div>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>
      <p className="text-xs text-muted">Tap to change photo</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
