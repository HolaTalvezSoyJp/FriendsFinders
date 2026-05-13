import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import type { NearbyStrangerEntry } from "@/lib/types";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
  useTransform: () => ({ get: () => 0 }),
  useAnimation: () => ({ start: vi.fn() }),
}));

const STRANGERS: NearbyStrangerEntry[] = [
  { userId: "bob", displayName: "Bob Martinez", profilePictureUrl: "", distanceMiles: 0.8 },
  { userId: "carol", displayName: "Carol Kim", profilePictureUrl: "", distanceMiles: 1.2 },
];

describe("SwipeDeck", () => {
  it("shows empty state when no strangers", () => {
    render(
      <SwipeDeck strangers={[]} onSwipeRight={vi.fn()} onSwipeLeft={vi.fn()} />
    );
    expect(screen.getByText(/No one nearby/i)).toBeTruthy();
  });

  it("renders top card with stranger name", () => {
    render(
      <SwipeDeck strangers={STRANGERS} onSwipeRight={vi.fn()} onSwipeLeft={vi.fn()} />
    );
    expect(screen.getByText("Bob Martinez")).toBeTruthy();
  });
});
