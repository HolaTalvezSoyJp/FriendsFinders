import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { FriendLocation } from './useNearbyFriends';
import { Friend } from './useFriends';

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng]); }, [lat, lng, map]);
  return null;
}

interface Props {
  userPosition: [number, number] | null;
  friends: FriendLocation[];
  friendList: Friend[];
  onRefresh: () => void;
}

export default function FriendsMap({ userPosition, friends, friendList, onRefresh }: Props) {
  const center: [number, number] = userPosition ?? [20.6597, -103.3496];
  const nameById = new Map(friendList.map((f) => [f.friendId, f.displayName]));

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <button
        onClick={onRefresh}
        style={{
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
        }}
      >
        🔄 Refresh map
      </button>
      <MapContainer center={center} zoom={16} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {userPosition && (
          <>
            <RecenterMap lat={userPosition[0]} lng={userPosition[1]} />
            <Marker position={userPosition}>
              <Popup>You</Popup>
            </Marker>
          </>
        )}
        {friends.map((f) => (
          <Marker key={f.friendId} position={[f.latitude, f.longitude]}>
            <Popup>
              <strong>{nameById.get(f.friendId) ?? f.friendId}</strong><br />
              {f.distanceMiles.toFixed(2)} mi away<br />
              <small>{new Date(f.lastUpdated).toLocaleTimeString()}</small>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
