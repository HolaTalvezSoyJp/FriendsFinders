import { useState, useEffect } from 'react';
import { getStoredToken, logout } from './auth';
import { useNearbyFriends } from './useNearbyFriends';
import { useFriends } from './useFriends';
import AuthPage from './AuthPage';
import FriendsMap from './FriendsMap';
import FriendList from './FriendList';

export default function App() {
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const { friends, loading, refresh } = useFriends(token);
  const friendsSignature = friends
    .map((f) => f.friendId)
    .sort()
    .join(',');
  const friendLocations = useNearbyFriends(token, friendsSignature);

  useEffect(() => {
    if (!token) return;
    navigator.geolocation.watchPosition(({ coords }) => {
      setUserPosition([coords.latitude, coords.longitude]);
    });
  }, [token]);

  if (!token) return <AuthPage onLogin={setToken} />;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 280, borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Friends (live map)</strong>
          <div style={{ fontSize: 11, color: '#666', marginTop: 4, lineHeight: 1.3 }}>
            Places here use your location and WebSocket. <strong>Discover</strong> lists only non-friends; accepted friends no longer appear there.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={refresh}
              disabled={loading}
              style={{ fontSize: 12, cursor: loading ? 'default' : 'pointer' }}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button onClick={() => { logout(); setToken(null); }} style={{ fontSize: 12, cursor: 'pointer' }}>
              Sign out
            </button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <FriendList friends={friends} friendLocations={friendLocations} />
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1 }}>
        <FriendsMap userPosition={userPosition} friends={friendLocations} />
      </div>
    </div>
  );
}
