import { useEffect, useRef, useState } from 'react';
import config from './config';

export interface FriendLocation {
  friendId: string;
  latitude: number;
  longitude: number;
  lastUpdated: string;
  distanceMiles: number;
}

export function useNearbyFriends(token: string | null) {
  const [friends, setFriends] = useState<FriendLocation[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`${config.websocketEndpoint}?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'init.response') {
        setFriends(msg.friends);
      } else if (msg.type === 'location.push') {
        setFriends((prev) => {
          const filtered = prev.filter((f) => f.friendId !== msg.friendId);
          return [...filtered, msg];
        });
      }
    };

    // Send location updates every 30 seconds
    const interval = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) return;
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        ws.send(JSON.stringify({
          action: 'location.update',
          latitude: coords.latitude,
          longitude: coords.longitude,
          timestamp: new Date().toISOString(),
        }));
      });
    }, 30_000);

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, [token]);

  return friends;
}
