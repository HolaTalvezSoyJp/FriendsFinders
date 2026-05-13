import type { InitResponseMessage, LocationPushMessage } from "@/lib/types";

// Simulates an API Gateway WebSocket when NEXT_PUBLIC_WS_URL is not set.
// Emits init.response with two mock friends, then pushes location updates every 5s.

const MOCK_FRIENDS = [
  {
    friendId: "bob",
    latitude: 37.7825,
    longitude: -122.4155,
    distanceMiles: 0.8,
  },
  {
    friendId: "carol",
    latitude: 37.769,
    longitude: -122.4255,
    distanceMiles: 1.2,
  },
] as const;

type EventMap = {
  open: Event;
  message: MessageEvent;
  close: CloseEvent;
  error: Event;
};

type Handler<K extends keyof EventMap> = (ev: EventMap[K]) => void;

export class MockWebSocket {
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  readyState: number = 0;

  onopen: Handler<"open"> | null = null;
  onmessage: Handler<"message"> | null = null;
  onclose: Handler<"close"> | null = null;
  onerror: Handler<"error"> | null = null;

  private interval: ReturnType<typeof setInterval> | null = null;
  private openTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(_url: string) {
    this.openTimeout = setTimeout(() => {
      this.readyState = 1;
      this.onopen?.(new Event("open"));

      const init: InitResponseMessage = {
        type: "init.response",
        friends: MOCK_FRIENDS.map((f) => ({
          ...f,
          lastUpdated: new Date().toISOString(),
        })),
      };
      this.dispatchMessage(init);

      this.interval = setInterval(() => {
        const friend = MOCK_FRIENDS[Math.floor(Math.random() * MOCK_FRIENDS.length)];
        const push: LocationPushMessage = {
          type: "location.push",
          friendId: friend.friendId,
          latitude: friend.latitude + (Math.random() - 0.5) * 0.001,
          longitude: friend.longitude + (Math.random() - 0.5) * 0.001,
          lastUpdated: new Date().toISOString(),
          distanceMiles: parseFloat(
            (friend.distanceMiles + (Math.random() - 0.5) * 0.2).toFixed(1)
          ),
        };
        this.dispatchMessage(push);
      }, 5000);
    }, 600);
  }

  private dispatchMessage(data: unknown): void {
    const ev = new MessageEvent("message", {
      data: JSON.stringify(data),
    });
    this.onmessage?.(ev);
  }

  send(_data: string): void {
    // Accept silently — mock doesn't need to process outbound messages
  }

  close(): void {
    if (this.openTimeout) clearTimeout(this.openTimeout);
    if (this.interval) clearInterval(this.interval);
    this.readyState = 3;
    this.onclose?.(new CloseEvent("close", { code: 1000, reason: "closed" }));
  }

  addEventListener<K extends keyof EventMap>(type: K, handler: Handler<K>): void {
    if (type === "open") this.onopen = handler as Handler<"open">;
    else if (type === "message") this.onmessage = handler as Handler<"message">;
    else if (type === "close") this.onclose = handler as Handler<"close">;
    else if (type === "error") this.onerror = handler as Handler<"error">;
  }

  removeEventListener(): void {
    // Cleanup is handled in close()
  }
}
