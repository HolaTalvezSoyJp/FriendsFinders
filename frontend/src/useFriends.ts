import { useCallback, useEffect, useState } from 'react';
import config from './config';

export interface Friend {
  friendId: string;
  displayName: string;
  profilePictureUrl?: string;
  friendsSince: string;
}

export function useFriends(token: string | null) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${config.httpApiEndpoint}/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as Friend[];
        setFriends(data);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { friends, loading, refresh };
}
