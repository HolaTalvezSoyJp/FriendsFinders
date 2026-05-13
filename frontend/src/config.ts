// Fill these in from `terraform output` after deploying
const config = {
  cognitoUserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID as string,
  cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID as string,
  httpApiEndpoint: import.meta.env.VITE_HTTP_API_ENDPOINT as string,
  websocketEndpoint: import.meta.env.VITE_WEBSOCKET_ENDPOINT as string,
};

export default config;
