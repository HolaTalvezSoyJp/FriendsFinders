import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
  BatchGetCommand,
} from '@aws-sdk/lib-dynamodb';
import { ConnectionRecord, UserProfile, FriendRequest } from '../types';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE_NAME || 'Connections';
const FRIENDSHIPS_TABLE = process.env.FRIENDSHIPS_TABLE_NAME || 'Friendships';
const USERS_TABLE = process.env.USERS_TABLE_NAME || 'Users';
const FRIEND_REQUESTS_TABLE = process.env.FRIEND_REQUESTS_TABLE_NAME || 'FriendRequests';

// --- Connections Table ---

export async function putConnection(record: ConnectionRecord): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: CONNECTIONS_TABLE,
    Item: record,
  }));
}

export async function deleteConnection(connectionId: string): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: CONNECTIONS_TABLE,
    Key: { connectionId },
  }));
}

export async function getConnection(connectionId: string): Promise<ConnectionRecord | undefined> {
  const result = await docClient.send(new GetCommand({
    TableName: CONNECTIONS_TABLE,
    Key: { connectionId },
  }));
  return result.Item as ConnectionRecord | undefined;
}

export async function getConnectionsByUserId(userId: string): Promise<ConnectionRecord[]> {
  const result = await docClient.send(new QueryCommand({
    TableName: CONNECTIONS_TABLE,
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }));
  return (result.Items || []) as ConnectionRecord[];
}

export async function updateConnectionLocation(
  connectionId: string,
  latitude: number,
  longitude: number,
  timestamp: string,
  expiresAt: number
): Promise<void> {
  await docClient.send(new UpdateCommand({
    TableName: CONNECTIONS_TABLE,
    Key: { connectionId },
    UpdateExpression: 'SET latitude = :lat, longitude = :lng, #ts = :ts, expiresAt = :exp',
    ExpressionAttributeNames: { '#ts': 'timestamp' },
    ExpressionAttributeValues: {
      ':lat': latitude,
      ':lng': longitude,
      ':ts': timestamp,
      ':exp': expiresAt,
    },
  }));
}

// --- Friendships Table ---

export async function getFriends(userId: string): Promise<{ userId: string; friendId: string; createdAt: string }[]> {
  const result = await docClient.send(new QueryCommand({
    TableName: FRIENDSHIPS_TABLE,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }));
  return (result.Items || []) as { userId: string; friendId: string; createdAt: string }[];
}

export async function putFriendship(userId: string, friendId: string): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: FRIENDSHIPS_TABLE,
    Item: {
      userId,
      friendId,
      createdAt: new Date().toISOString(),
    },
  }));
}

export async function deleteFriendship(userId: string, friendId: string): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: FRIENDSHIPS_TABLE,
    Key: { userId, friendId },
  }));
}

export async function getFriendCount(userId: string): Promise<number> {
  const result = await docClient.send(new QueryCommand({
    TableName: FRIENDSHIPS_TABLE,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
    Select: 'COUNT',
  }));
  return result.Count || 0;
}

// --- Users Table ---

export async function getUser(userId: string): Promise<UserProfile | undefined> {
  const result = await docClient.send(new GetCommand({
    TableName: USERS_TABLE,
    Key: { userId },
  }));
  return result.Item as UserProfile | undefined;
}

export async function putUser(profile: UserProfile): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: profile,
  }));
}

export async function updateUser(userId: string, updates: Partial<Pick<UserProfile, 'displayName' | 'profilePictureKey' | 'discoverable'>>): Promise<void> {
  const expressionParts: string[] = [];
  const expressionValues: Record<string, unknown> = {};
  const expressionNames: Record<string, string> = {};

  if (updates.displayName !== undefined) {
    expressionParts.push('#dn = :dn');
    expressionNames['#dn'] = 'displayName';
    expressionValues[':dn'] = updates.displayName;
  }
  if (updates.profilePictureKey !== undefined) {
    expressionParts.push('#ppk = :ppk');
    expressionNames['#ppk'] = 'profilePictureKey';
    expressionValues[':ppk'] = updates.profilePictureKey;
  }
  if (updates.discoverable !== undefined) {
    expressionParts.push('#disc = :disc');
    expressionNames['#disc'] = 'discoverable';
    expressionValues[':disc'] = updates.discoverable;
  }

  if (expressionParts.length === 0) return;

  await docClient.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { userId },
    UpdateExpression: `SET ${expressionParts.join(', ')}`,
    ExpressionAttributeNames: expressionNames,
    ExpressionAttributeValues: expressionValues,
  }));
}

// --- Friend Requests Table ---

export async function putFriendRequest(request: FriendRequest): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: FRIEND_REQUESTS_TABLE,
    Item: request,
  }));
}

export async function getFriendRequest(requestId: string): Promise<FriendRequest | undefined> {
  const result = await docClient.send(new GetCommand({
    TableName: FRIEND_REQUESTS_TABLE,
    Key: { requestId },
  }));
  return result.Item as FriendRequest | undefined;
}

export async function getFriendRequestsByToUser(toUserId: string): Promise<FriendRequest[]> {
  const result = await docClient.send(new QueryCommand({
    TableName: FRIEND_REQUESTS_TABLE,
    IndexName: 'toUserId-index',
    KeyConditionExpression: 'toUserId = :tuid',
    ExpressionAttributeValues: { ':tuid': toUserId },
  }));
  return (result.Items || []) as FriendRequest[];
}

export async function deleteFriendRequest(requestId: string): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: FRIEND_REQUESTS_TABLE,
    Key: { requestId },
  }));
}

// --- Active Connections (for nearby strangers) ---

export async function getActiveConnections(): Promise<ConnectionRecord[]> {
  const now = Math.floor(Date.now() / 1000);
  const result = await docClient.send(new ScanCommand({
    TableName: CONNECTIONS_TABLE,
    FilterExpression: 'expiresAt > :now AND attribute_exists(latitude) AND attribute_exists(longitude)',
    ExpressionAttributeValues: { ':now': now },
  }));
  return (result.Items || []) as ConnectionRecord[];
}

export async function batchGetConnections(connectionIds: string[]): Promise<ConnectionRecord[]> {
  if (connectionIds.length === 0) return [];

  const keys = connectionIds.map(id => ({ connectionId: id }));
  const result = await docClient.send(new BatchGetCommand({
    RequestItems: {
      [CONNECTIONS_TABLE]: { Keys: keys },
    },
  }));
  return (result.Responses?.[CONNECTIONS_TABLE] || []) as ConnectionRecord[];
}
