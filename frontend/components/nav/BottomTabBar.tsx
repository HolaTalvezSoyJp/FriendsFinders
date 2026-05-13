"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Users, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWSStore } from "@/lib/store/ws";

const TABS = [
  { href: "/discover", label: "Discover", Icon: Compass },
  { href: "/friends", label: "Friends", Icon: Users },
  { href: "/requests", label: "Requests", Icon: Bell },
  { href: "/profile", label: "Profile", Icon: User },
] as const;

const STATUS_DOT: Record<string, string> = {
  connected: "bg-success",
  reconnecting: "bg-yellow-400",
  error: "bg-danger",
};

export function BottomTabBar() {
  const pathname = usePathname();
  const wsStatus = useWSStore((s) => s.status);
  const dotColor = STATUS_DOT[wsStatus];

  return (
    <nav className="relative flex border-t border-white/5 bg-surface pb-safe">
      {dotColor && (
        <span
          className={cn(
            "absolute right-3 top-2 h-2 w-2 rounded-full",
            dotColor
          )}
        />
      )}
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
              active ? "text-white" : "text-muted hover:text-white/60"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 transition-all",
                active && "drop-shadow-[0_0_8px_rgba(255,107,107,0.8)]"
              )}
              style={
                active
                  ? {
                      stroke: "url(#tab-gradient)",
                    }
                  : undefined
              }
            />
            <span>{label}</span>
          </Link>
        );
      })}
      {/* Gradient def for active icon */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="tab-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="100%" stopColor="#FF8E53" />
          </linearGradient>
        </defs>
      </svg>
    </nav>
  );
}
