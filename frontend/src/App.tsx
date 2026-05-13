import { useState, useEffect } from 'react';
import { getStoredToken, logout } from './auth';
import { useNearbyFriends } from './useNearbyFriends';
import AuthPage from './AuthPage';
import FriendsMap from './FriendsMap';
import FriendList from './FriendList';

export default function App() {
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const friends = useNearbyFriends(token);

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
          <strong>📍 Nearby Friends</strong>
          <button onClick={() => { logout(); setToken(null); }} style={{ fontSize: 12, cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <FriendList friends={friends} />
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1 }}>
        <FriendsMap userPosition={userPosition} friends={friends} />
      </div>
    </div>
  );
}
