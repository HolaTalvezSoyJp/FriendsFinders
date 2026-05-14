import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function FriendList({ friends, friendLocations }) {
    if (friends.length === 0) {
        return _jsx("p", { style: { padding: 16, color: '#888' }, children: "No friends yet." });
    }
    const locationById = new Map(friendLocations.map((l) => [l.friendId, l]));
    const rows = friends
        .map((f) => ({ friend: f, location: locationById.get(f.friendId) }))
        .sort((a, b) => {
        const da = a.location?.distanceMiles ?? Infinity;
        const db = b.location?.distanceMiles ?? Infinity;
        return da - db;
    });
    return (_jsx("ul", { style: { listStyle: 'none', margin: 0, padding: 0 }, children: rows.map(({ friend, location }) => (_jsxs("li", { style: { padding: '12px 16px', borderBottom: '1px solid #eee' }, children: [_jsx("strong", { children: friend.displayName }), location ? (_jsxs("span", { style: { float: 'right', color: '#555' }, children: [location.distanceMiles.toFixed(2), " mi"] })) : (_jsx("span", { style: { float: 'right', color: '#bbb' }, title: "Share location and keep WebSocket open for live distance", children: "Offline" })), _jsx("br", {}), location ? (_jsxs("small", { style: { color: '#999' }, children: ["Updated ", new Date(location.lastUpdated).toLocaleTimeString()] })) : (_jsx("small", { style: { color: '#bbb' }, children: "No live location yet \u2014 allow GPS and WebSocket" }))] }, friend.friendId))) }));
}
