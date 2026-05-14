import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
function RecenterMap({ lat, lng }) {
    const map = useMap();
    useEffect(() => { map.setView([lat, lng]); }, [lat, lng, map]);
    return null;
}
export default function FriendsMap({ userPosition, friends }) {
    const center = userPosition ?? [20.6597, -103.3496]; // Guadalajara default
    return (_jsxs(MapContainer, { center: center, zoom: 13, style: { height: '100%', width: '100%' }, children: [_jsx(TileLayer, { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), userPosition && (_jsxs(_Fragment, { children: [_jsx(RecenterMap, { lat: userPosition[0], lng: userPosition[1] }), _jsx(Marker, { position: userPosition, children: _jsx(Popup, { children: "You" }) })] })), friends.map((f) => (_jsx(Marker, { position: [f.latitude, f.longitude], children: _jsxs(Popup, { children: [f.friendId, _jsx("br", {}), f.distanceMiles.toFixed(2), " mi away", _jsx("br", {}), _jsx("small", { children: new Date(f.lastUpdated).toLocaleTimeString() })] }) }, f.friendId)))] }));
}
