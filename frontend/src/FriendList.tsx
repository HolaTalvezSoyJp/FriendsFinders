import { FriendLocation } from '../useNearbyFriends';

interface Props {
  friends: FriendLocation[];
}

export default function FriendList({ friends }: Props) {
  if (friends.length === 0) {
    return <p style={{ padding: 16, color: '#888' }}>No friends nearby.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {[...friends]
        .sort((a, b) => a.distanceMiles - b.distanceMiles)
        .map((f) => (
          <li key={f.friendId} style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
            <strong>{f.friendId}</strong>
            <span style={{ float: 'right', color: '#555' }}>{f.distanceMiles.toFixed(2)} mi</span>
            <br />
            <small style={{ color: '#999' }}>
              Updated {new Date(f.lastUpdated).toLocaleTimeString()}
            </small>
          </li>
        ))}
    </ul>
  );
}
