import { useCallback, useEffect, useRef, useState } from 'react';
import config from './config';

export interface FriendLocation {
  friendId: string;
  latitude: number;
  longitude: number;
  lastUpdated: string;
  distanceMiles: number;
}

const EARTH_RADIUS_MI = 3958.8;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MI * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function mergeInitFriends(incoming: FriendLocation[], prev: FriendLocation[]): FriendLocation[] {
  return incoming.map((f) => {
    const p = prev.find((x) => x.friendId === f.friendId);
    let dist = f.distanceMiles ?? 0;
    if (
      p &&
      dist === 0 &&
      p.distanceMiles > 0 &&
      p.latitude === f.latitude &&
      p.longitude === f.longitude &&
      p.lastUpdated === f.lastUpdated
    ) {
      dist = p.distanceMiles;
    }
    return { ...f, distanceMiles: dist };
  });
}

export function useNearbyFriends(token: string | null) {
  const [friends, setFriends] = useState<FriendLocation[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const userCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const applyDisplayDistances = useCallback((list: FriendLocation[]): FriendLocation[] => {
    const u = userCoordsRef.current;
    if (!u) return list;
    return list.map((f) => ({
      ...f,
      distanceMiles: Math.round(haversineMiles(u.lat, u.lng, f.latitude, f.longitude) * 100) / 100,
    }));
  }, []);

  const refresh = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ action: 'friends.refresh' }));
  }, []);

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`${config.websocketEndpoint}?token=${token}`);
    wsRef.current = ws;

    const sendLocation = () => {
      if (ws.readyState !== WebSocket.OPEN) return;
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        userCoordsRef.current = { lat: coords.latitude, lng: coords.longitude };
        ws.send(JSON.stringify({
          action: 'location.update',
          latitude: coords.latitude,
          longitude: coords.longitude,
          timestamp: new Date().toISOString(),
        }));
        setFriends((p) => applyDisplayDistances(p));
      });
    };

    ws.onopen = () => {
      sendLocation();
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'init.response') {
        const raw = ((msg.friends as FriendLocation[]) || []).filter(
          (f) => f.latitude !== undefined && f.longitude !== undefined,
        );
        setFriends((prev) => applyDisplayDistances(mergeInitFriends(raw, prev)));
      } else if (msg.type === 'location.push') {
        setFriends((prev) => {
          const filtered = prev.filter((f) => f.friendId !== msg.friendId);
          return applyDisplayDistances([...filtered, msg]);
        });
      }
    };

    const interval = setInterval(() => sendLocation(), 30_000);

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, [token, applyDisplayDistances]);

  return { friends, refresh };
}
