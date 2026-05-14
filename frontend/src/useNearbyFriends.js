import { useCallback, useEffect, useRef, useState } from 'react';
import config from './config';
export function useNearbyFriends(token) {
    const [friends, setFriends] = useState([]);
    const wsRef = useRef(null);
    const sendLocation = (ws) => {
        if (ws.readyState !== WebSocket.OPEN)
            return;
        navigator.geolocation.getCurrentPosition(({ coords }) => {
            ws.send(JSON.stringify({
                action: 'location.update',
                latitude: coords.latitude,
                longitude: coords.longitude,
                timestamp: new Date().toISOString(),
            }));
        });
    };
    const refresh = useCallback(() => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN)
            return;
        ws.send(JSON.stringify({ action: 'friends.refresh' }));
    }, []);
    useEffect(() => {
        if (!token)
            return;
        const ws = new WebSocket(`${config.websocketEndpoint}?token=${token}`);
        wsRef.current = ws;
        ws.onopen = () => {
            // Send location immediately on connect
            sendLocation(ws);
        };
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'init.response') {
                setFriends(msg.friends.filter((f) => f.latitude !== undefined && f.longitude !== undefined));
            }
            else if (msg.type === 'location.push') {
                setFriends((prev) => {
                    const filtered = prev.filter((f) => f.friendId !== msg.friendId);
                    return [...filtered, msg];
                });
            }
        };
        // Send location updates every 30 seconds
        const interval = setInterval(() => sendLocation(ws), 30_000);
        return () => {
            clearInterval(interval);
            ws.close();
        };
    }, [token]);
    return { friends, refresh };
}
