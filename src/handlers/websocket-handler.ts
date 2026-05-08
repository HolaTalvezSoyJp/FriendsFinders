import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  putConnection,
  deleteConnection,
  getConnection,
  getConnectionsByUserId,
  getFriends,
  updateConnectionLocation,
} from '../utils/dynamo-client';
import { postToConnection } from '../utils/apigw-client';
import { getConfig } from '../utils/config';
import { haversine } from '../utils/distance';
import { validateLocationUpdate } from '../utils/validation';
import { buildInitResponse, buildLocationPush } from '../utils/message-utils';
import { ConnectionRecord, NearbyFriendEntry } from '../types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const routeKey = (event.requestContext as unknown as { routeKey: string }).routeKey;
  const connectionId = event.requestContext.connectionId!;

  switch (routeKey) {
    case '$connect':
      return handleConnect(event, connectionId);
    case '$disconnect':
      return handleDisconnect(connectionId);
    case 'location.update':
      return handleLocationUpdate(event, connectionId);
    default:
      return { statusCode: 400, body: JSON.stringify({ error: 'Unknown route' }) };
  }
}

async function handleConnect(event: APIGatewayProxyEvent, connectionId: string): Promise<APIGatewayProxyResult> {
  const token = event.queryStringParameters?.token;
  if (!token) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // For MVP: token IS the userId
  const userId = token;
  const config = await getConfig();
  const now = new Date();
  const expiresAt = Math.floor(now.getTime() / 1000) + config.inactivityTtlSeconds;

  // Store connection record
  await putConnection({
    connectionId,
    userId,
    connectedAt: now.toISOString(),
    expiresAt,
  });

  // Fetch user's friends
  const friends = await getFriends(userId);

  // For each friend, find their active connections with location
  const nearbyFriends: NearbyFriendEntry[] = [];
  const currentTime = Math.floor(Date.now() / 1000);

  for (const friend of friends) {
    const friendConnections = await getConnectionsByUserId(friend.friendId);
    for (const conn of friendConnections) {
      if (conn.latitude !== undefined && conn.longitude !== undefined && conn.expiresAt > currentTime && conn.timestamp) {
        // We don't have the user's location yet at connect time, so we include all active friends
        // The client will filter by distance or we skip distance filtering on init
        nearbyFriends.push({
          friendId: friend.friendId,
          latitude: conn.latitude,
          longitude: conn.longitude,
          lastUpdated: conn.timestamp,
          distanceMiles: 0, // Distance unknown at connect (user hasn't sent location yet)
        });
        break; // One entry per friend
      }
    }
  }

  // Send init.response to the connecting client
  const initResponse = buildInitResponse(nearbyFriends);
  try {
    await postToConnection(connectionId, initResponse);
  } catch (err) {
    console.error('Failed to send init.response:', err);
  }

  return { statusCode: 200, body: 'Connected' };
}

async function handleDisconnect(connectionId: string): Promise<APIGatewayProxyResult> {
  try {
    await deleteConnection(connectionId);
  } catch (err) {
    console.error('Error deleting connection:', err);
  }
  return { statusCode: 200, body: 'Disconnected' };
}

async function handleLocationUpdate(event: APIGatewayProxyEvent, connectionId: string): Promise<APIGatewayProxyResult> {
  const body = event.body ? JSON.parse(event.body) : null;

  const validation = validateLocationUpdate(body);
  if (!validation.valid) {
    try {
      await postToConnection(connectionId, { type: 'error', message: validation.error });
    } catch (err) {
      console.error('Failed to send error message:', err);
    }
    return { statusCode: 200, body: 'Invalid' };
  }

  // Look up connection to get userId
  const connection = await getConnection(connectionId);
  if (!connection) {
    return { statusCode: 200, body: 'Connection not found' };
  }

  const config = await getConfig();
  const expiresAt = Math.floor(Date.now() / 1000) + config.inactivityTtlSeconds;

  // Update connection with new location and refresh TTL
  await updateConnectionLocation(
    connectionId,
    body.latitude,
    body.longitude,
    body.timestamp,
    expiresAt
  );

  return { statusCode: 200, body: 'OK' };
}
