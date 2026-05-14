import { useEffect, useRef, useState } from 'react';
import config from './config';
function sendLocationUpdate(ws, lat, lng) {
    ws.send(JSON.stringify({
        action: 'location.update',
        latitude: lat,
        longitude: lng,
        timestamp: new Date().toISOString(),
    }));
}
/** Live friend locations via WebSocket. Pass friendsSignature (e.g. sorted friend ids) to refresh the server friend list after accept without reconnecting. */
export function useNearbyFriends(token, friendsSignature) {
    const [friends, setFriends] = useState([]);
    const wsRef = useRef(null);
    const signatureRef = useRef(friendsSignature);
    signatureRef.current = friendsSignature;
    useEffect(() => {
        if (!token)
            return;
        const ws = new WebSocket(`${config.websocketEndpoint}?token=${token}`);
        wsRef.current = ws;
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'init.response') {
                setFriends(msg.friends);
            }
            else if (msg.type === 'location.push') {
                setFriends((prev) => {
                    const filtered = prev.filter((f) => f.friendId !== msg.friendId);
                    return [...filtered, msg];
                });
            }
        };
        ws.onopen = () => {
            navigator.geolocation.getCurrentPosition(({ coords }) => {
                sendLocationUpdate(ws, coords.latitude, coords.longitude);
            }, () => {
                /* GPS denied — interval may still run later */
            });
            const sig = signatureRef.current;
            if (sig) {
                ws.send(JSON.stringify({ action: 'friends.refresh' }));
            }
        };
        const interval = setInterval(() => {
            if (ws.readyState !== WebSocket.OPEN)
                return;
            navigator.geolocation.getCurrentPosition(({ coords }) => {
                sendLocationUpdate(ws, coords.latitude, coords.longitude);
            });
        }, 30_000);
        return () => {
            clearInterval(interval);
            ws.close();
        };
    }, [token]);
    useEffect(() => {
        if (!friendsSignature)
            return;
        const ws = wsRef.current;
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'friends.refresh' }));
        }
    }, [friendsSignature]);
    return friends;
}
