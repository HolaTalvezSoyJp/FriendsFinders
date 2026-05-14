import { useCallback, useEffect, useState } from 'react';
import config from './config';
export function useFriends(token) {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const refresh = useCallback(async () => {
        if (!token)
            return;
        setLoading(true);
        try {
            const res = await fetch(`${config.httpApiEndpoint}/friends`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = (await res.json());
                setFriends(data);
            }
        }
        finally {
            setLoading(false);
        }
    }, [token]);
    useEffect(() => {
        refresh();
    }, [refresh]);
    return { friends, loading, refresh };
}
