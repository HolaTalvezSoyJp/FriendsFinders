import { DynamoDBStreamEvent } from 'aws-lambda';
import { getFriends, getConnectionsByUserId } from '../utils/dynamo-client';
import { postToConnection } from '../utils/apigw-client';
import { getConfig } from '../utils/config';
import { haversine } from '../utils/distance';
import { buildLocationPush } from '../utils/message-utils';

export async function handler(event: DynamoDBStreamEvent): Promise<void> {
  const config = await getConfig();
  const currentTime = Math.floor(Date.now() / 1000);

  for (const record of event.Records) {
    if (record.eventName !== 'MODIFY') continue;

    const newImage = record.dynamodb?.NewImage;
    const oldImage = record.dynamodb?.OldImage;
    if (!newImage) continue;

    // Check if location data exists in new image
    const newLat = newImage.latitude?.N;
    const newLng = newImage.longitude?.N;
    if (!newLat || !newLng) continue;

    // Check if location actually changed
    const oldLat = oldImage?.latitude?.N;
    const oldLng = oldImage?.longitude?.N;
    if (oldLat === newLat && oldLng === newLng) continue;

    const userId = newImage.userId?.S;
    const timestamp = newImage.timestamp?.S;
    if (!userId || !timestamp) continue;

    const latitude = parseFloat(newLat);
    const longitude = parseFloat(newLng);

    // Get user's friends
    const friends = await getFriends(userId);

    for (const friend of friends) {
      // Get friend's active connections
      const friendConnections = await getConnectionsByUserId(friend.friendId);

      for (const conn of friendConnections) {
        if (conn.expiresAt <= currentTime) continue;
        if (conn.latitude === undefined || conn.longitude === undefined) continue;

        // Compute distance between updated user and friend
        const distance = haversine(latitude, longitude, conn.latitude, conn.longitude);

        if (distance <= config.searchRadiusMiles) {
          // Friend is within radius — push location update
          const message = buildLocationPush(userId, latitude, longitude, timestamp, distance);
          try {
            await postToConnection(conn.connectionId, message);
          } catch (err: unknown) {
            const error = err as { name?: string; statusCode?: number };
            if (error.name === 'GoneException' || error.statusCode === 410) {
              console.log(`Connection ${conn.connectionId} is gone, skipping`);
            } else {
              console.error(`Failed to post to connection ${conn.connectionId}:`, err);
            }
          }
        }
      }
    }
  }
}
