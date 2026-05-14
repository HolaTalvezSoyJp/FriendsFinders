import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { getStoredToken, logout } from './auth';
import { useNearbyFriends } from './useNearbyFriends';
import { useFriends } from './useFriends';
import AuthPage from './AuthPage';
import FriendsMap from './FriendsMap';
import FriendList from './FriendList';
export default function App() {
    const [token, setToken] = useState(getStoredToken);
    const [userPosition, setUserPosition] = useState(null);
    const { friends, loading, refresh } = useFriends(token);
    const friendsSignature = friends
        .map((f) => f.friendId)
        .sort()
        .join(',');
    const friendLocations = useNearbyFriends(token, friendsSignature);
    useEffect(() => {
        if (!token)
            return;
        navigator.geolocation.watchPosition(({ coords }) => {
            setUserPosition([coords.latitude, coords.longitude]);
        });
    }, [token]);
    if (!token)
        return _jsx(AuthPage, { onLogin: setToken });
    return (_jsxs("div", { style: { display: 'flex', height: '100vh', fontFamily: 'sans-serif' }, children: [_jsxs("div", { style: { width: 280, borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column' }, children: [_jsxs("div", { style: { padding: '12px 16px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("strong", { children: "Friends (live map)" }), _jsxs("div", { style: { fontSize: 11, color: '#666', marginTop: 4, lineHeight: 1.3 }, children: ["Places here use your location and WebSocket. ", _jsx("strong", { children: "Discover" }), " lists only non-friends; accepted friends no longer appear there."] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { onClick: refresh, disabled: loading, style: { fontSize: 12, cursor: loading ? 'default' : 'pointer' }, children: loading ? 'Refreshing…' : 'Refresh' }), _jsx("button", { onClick: () => { logout(); setToken(null); }, style: { fontSize: 12, cursor: 'pointer' }, children: "Sign out" })] })] }), _jsx("div", { style: { overflowY: 'auto', flex: 1 }, children: _jsx(FriendList, { friends: friends, friendLocations: friendLocations }) })] }), _jsx("div", { style: { flex: 1 }, children: _jsx(FriendsMap, { userPosition: userPosition, friends: friendLocations }) })] }));
}
