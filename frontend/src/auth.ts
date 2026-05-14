import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';
import config from './config';

const userPool = new CognitoUserPool({
  UserPoolId: config.cognitoUserPoolId,
  ClientId: config.cognitoClientId,
});

export function register(email: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const attributes = [new CognitoUserAttribute({ Name: 'email', Value: email })];
    userPool.signUp(email, password, attributes, [], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function login(email: string, password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const auth = new AuthenticationDetails({ Username: email, Password: password });
    user.authenticateUser(auth, {
      onSuccess: (session) => resolve(session.getIdToken().getJwtToken()),
      onFailure: reject,
    });
  });
}

export function getStoredToken(): string | null {
  const user = userPool.getCurrentUser();
  if (!user) return null;
  let token: string | null = null;
  user.getSession((err: Error | null, session: any) => {
    if (!err && session.isValid()) token = session.getIdToken().getJwtToken();
  });
  return token;
}

export function logout(): void {
  userPool.getCurrentUser()?.signOut();
}
