// Fill these in from `terraform output` after deploying
const config = {
    cognitoUserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
    cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    httpApiEndpoint: import.meta.env.VITE_HTTP_API_ENDPOINT,
    websocketEndpoint: import.meta.env.VITE_WEBSOCKET_ENDPOINT,
};
export default config;
