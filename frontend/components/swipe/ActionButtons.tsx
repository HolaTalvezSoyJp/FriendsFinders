"use client";

import { X, Heart } from "lucide-react";

interface Props {
  onPass: () => void;
  onLike: () => void;
  disabled?: boolean;
}

export function ActionButtons({ onPass, onLike, disabled }: Props) {
  return (
    <div className="flex items-center justify-center gap-8">
      <button
        onClick={onPass}
        disabled={disabled}
        aria-label="Pass"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-surface border border-white/10 shadow-lg text-danger transition-all hover:scale-110 hover:border-danger/40 active:scale-95 disabled:opacity-40"
      >
        <X className="h-7 w-7" />
      </button>
      <button
        onClick={onLike}
        disabled={disabled}
        aria-label="Like"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-end shadow-lg text-white transition-all hover:scale-110 active:scale-95 disabled:opacity-40"
      >
        <Heart className="h-7 w-7 fill-white" />
      </button>
    </div>
  );
}
