"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useWSStore } from "@/lib/store/ws";
import { useFriendsStore } from "@/lib/store/friends";
import { MockWebSocket } from "@/lib/ws/mock-socket";
import { inboundMessageSchema } from "@/lib/ws/messages";
import { startGeolocationPoller } from "@/lib/geolocation";

// Module-level send ref so other modules can call sendWS()
let _sendRef: ((data: string) => void) | null = null;
export function sendWS(data: string): void {
  _sendRef?.(data);
}

export function WSProvider({ children }: { children: React.ReactNode }) {
  const userId = useAuthStore((s) => s.userId);
  const setStatus = useWSStore((s) => s.setStatus);
  const setFriends = useFriendsStore((s) => s.setFriends);
  const upsertFriend = useFriendsStore((s) => s.upsertFriend);

  const socketRef = useRef<WebSocket | MockWebSocket | null>(null);
  const backoffRef = useRef(1000);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;

    function connect() {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
      setStatus("connecting");

      const socket = wsUrl
        ? new WebSocket(`${wsUrl}?token=${userId}`)
        : (new MockWebSocket(`mock?token=${userId}`) as unknown as WebSocket);

      socketRef.current = socket;
      _sendRef = (data) => {
        if (socket.readyState === 1) socket.send(data);
      };

      socket.onopen = () => {
        setStatus("connected");
        backoffRef.current = 1000;
      };

      socket.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data as string);
          const msg = inboundMessageSchema.parse(raw);
          if (msg.type === "init.response") {
            setFriends(new Map(msg.friends.map((f) => [f.friendId, f])));
          } else {
            upsertFriend(msg.friendId, {
              friendId: msg.friendId,
              latitude: msg.latitude,
              longitude: msg.longitude,
              lastUpdated: msg.lastUpdated,
              distanceMiles: msg.distanceMiles,
            });
          }
        } catch {
          console.warn("[WS] invalid message:", event.data);
        }
      };

      socket.onclose = () => {
        _sendRef = null;
        setStatus("reconnecting");
        const delay = backoffRef.current + Math.random() * 500;
        backoffRef.current = Math.min(backoffRef.current * 2, 30_000);
        reconnectRef.current = setTimeout(connect, delay);
      };

      socket.onerror = () => setStatus("error");
    }

    connect();

    const stopGeo = startGeolocationPoller((lat, lng) => {
      const msg = JSON.stringify({
        action: "location.update",
        latitude: lat,
        longitude: lng,
        timestamp: new Date().toISOString(),
      });
      _sendRef?.(msg);
    });

    return () => {
      stopGeo();
      _sendRef = null;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      socketRef.current?.close();
    };
  }, [userId, setStatus, setFriends, upsertFriend]);

  return <>{children}</>;
}
