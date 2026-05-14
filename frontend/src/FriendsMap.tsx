import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { FriendLocation } from './useNearbyFriends';

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng]); }, [lat, lng, map]);
  return null;
}

interface Props {
  userPosition: [number, number] | null;
  friends: FriendLocation[];
}

export default function FriendsMap({ userPosition, friends }: Props) {
  const center: [number, number] = userPosition ?? [20.6597, -103.3496]; // Guadalajara default

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
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
            {f.friendId}<br />
            {f.distanceMiles.toFixed(2)} mi away<br />
            <small>{new Date(f.lastUpdated).toLocaleTimeString()}</small>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
