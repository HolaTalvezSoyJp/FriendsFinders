import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

let client: ApiGatewayManagementApiClient | null = null;

function getClient(): ApiGatewayManagementApiClient {
  if (!client) {
    const endpoint = process.env.WEBSOCKET_API_ENDPOINT;
    client = new ApiGatewayManagementApiClient({ endpoint });
  }
  return client;
}

export async function postToConnection(connectionId: string, data: object): Promise<void> {
  const command = new PostToConnectionCommand({
    ConnectionId: connectionId,
    Data: Buffer.from(JSON.stringify(data)),
  });
  await getClient().send(command);
}
