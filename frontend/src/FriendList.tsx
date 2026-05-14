import { FriendLocation } from './useNearbyFriends';
import { Friend } from './useFriends';

interface Props {
  friends: Friend[];
  friendLocations: FriendLocation[];
}

export default function FriendList({ friends, friendLocations }: Props) {
  if (friends.length === 0) {
    return <p style={{ padding: 16, color: '#888' }}>No friends yet.</p>;
  }

  const locationById = new Map(friendLocations.map((l) => [l.friendId, l]));

  const rows = friends
    .map((f) => ({ friend: f, location: locationById.get(f.friendId) }))
    .sort((a, b) => {
      const da = a.location?.distanceMiles ?? Infinity;
      const db = b.location?.distanceMiles ?? Infinity;
      return da - db;
    });

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {rows.map(({ friend, location }) => (
        <li key={friend.friendId} style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
          <strong>{friend.displayName}</strong>
          {location ? (
            <span style={{ float: 'right', color: '#555' }}>{location.distanceMiles.toFixed(2)} mi</span>
          ) : (
            <span style={{ float: 'right', color: '#bbb' }} title="Share location and keep WebSocket open for live distance">
              Offline
            </span>
          )}
          <br />
          {location ? (
            <small style={{ color: '#999' }}>
              Updated {new Date(location.lastUpdated).toLocaleTimeString()}
            </small>
          ) : (
            <small style={{ color: '#bbb' }}>No live location yet — allow GPS and WebSocket</small>
          )}
        </li>
      ))}
    </ul>
  );
}
