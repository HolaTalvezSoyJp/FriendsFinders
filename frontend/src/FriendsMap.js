import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
function RecenterMap({ lat, lng }) {
    const map = useMap();
    useEffect(() => { map.setView([lat, lng]); }, [lat, lng, map]);
    return null;
}
export default function FriendsMap({ userPosition, friends, friendList, onRefresh }) {
    const center = userPosition ?? [20.6597, -103.3496];
    const nameById = new Map(friendList.map((f) => [f.friendId, f.displayName]));
    return (_jsxs("div", { style: { height: '100%', width: '100%', position: 'relative' }, children: [_jsx("button", { onClick: onRefresh, style: {
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 1000,
                    background: 'white',
                    border: '1px solid #ccc',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 13,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }, children: "\uD83D\uDD04 Refresh map" }), _jsxs(MapContainer, { center: center, zoom: 16, style: { height: '100%', width: '100%' }, children: [_jsx(TileLayer, { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), userPosition && (_jsxs(_Fragment, { children: [_jsx(RecenterMap, { lat: userPosition[0], lng: userPosition[1] }), _jsx(Marker, { position: userPosition, children: _jsx(Popup, { children: "You" }) })] })), friends.map((f) => (_jsx(Marker, { position: [f.latitude, f.longitude], children: _jsxs(Popup, { children: [_jsx("strong", { children: nameById.get(f.friendId) ?? f.friendId }), _jsx("br", {}), f.distanceMiles.toFixed(2), " mi away", _jsx("br", {}), _jsx("small", { children: new Date(f.lastUpdated).toLocaleTimeString() })] }) }, f.friendId)))] })] }));
}
