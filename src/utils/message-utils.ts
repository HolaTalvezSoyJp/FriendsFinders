import { LocationUpdateMessage, LocationPushMessage, InitResponseMessage, NearbyFriendEntry } from '../types';

export function parseLocationUpdate(body: string): LocationUpdateMessage {
  const parsed = JSON.parse(body);
  return {
    action: 'location.update',
    latitude: parsed.latitude,
    longitude: parsed.longitude,
    timestamp: parsed.timestamp,
  };
}

export function buildLocationPush(
  friendId: string,
  latitude: number,
  longitude: number,
  lastUpdated: string,
  distanceMiles: number
): LocationPushMessage {
  return {
    type: 'location.push',
    friendId,
    latitude,
    longitude,
    lastUpdated,
    distanceMiles: Math.round(distanceMiles * 100) / 100,
  };
}

export function buildInitResponse(friends: NearbyFriendEntry[]): InitResponseMessage {
  return {
    type: 'init.response',
    friends,
  };
}
