import { Amplify } from 'aws-amplify';
import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser as amplifyGetCurrentUser,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
} from 'aws-amplify/auth';

export type UserRole = 'sales' | 'company';

export type FireRankyUser = {
  email: string;
  role: UserRole;
};

let configured = false;

function ensureConfigured() {
  if (configured) return;

  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID;

  if (!userPoolId || !userPoolClientId) {
    throw new Error('Cognito is not configured yet. Add NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID to .env.local.');
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: { email: true },
      },
    },
  });

  configured = true;
}

function normalizeRole(value?: string): UserRole {
  return value === 'company' ? 'company' : 'sales';
}

export async function getCurrentUser(): Promise<FireRankyUser | null> {
  try {
    ensureConfigured();
    await amplifyGetCurrentUser();
    const attributes = await fetchUserAttributes();
    return {
      email: attributes.email || '',
      role: normalizeRole(attributes['custom:role']),
    };
  } catch {
    return null;
  }
}

export async function getIdToken(): Promise<string> {
  ensureConfigured();
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error('No Cognito session found.');
  return token;
}

export async function signUp(email: string, password: string, role: UserRole): Promise<FireRankyUser> {
  ensureConfigured();
  const normalizedEmail = email.trim().toLowerCase();

  const result = await amplifySignUp({
    username: normalizedEmail,
    password,
    options: {
      userAttributes: {
        email: normalizedEmail,
        'custom:role': role,
      },
    },
  });

  if (!result.isSignUpComplete) {
    throw new Error('This Cognito pool still requires account confirmation. Enable the FireRanky auto-confirm pre-sign-up trigger for the MVP.');
  }

  return signIn(normalizedEmail, password);
}

export async function signIn(email: string, password: string): Promise<FireRankyUser> {
  ensureConfigured();
  const normalizedEmail = email.trim().toLowerCase();

  const result = await amplifySignIn({
    username: normalizedEmail,
    password,
  });

  if (!result.isSignedIn) {
    throw new Error('Sign-in needs an additional Cognito step that is not enabled in the MVP.');
  }

  const attributes = await fetchUserAttributes();
  return {
    email: attributes.email || normalizedEmail,
    role: normalizeRole(attributes['custom:role']),
  };
}

export async function signOut(): Promise<void> {
  ensureConfigured();
  await amplifySignOut();
}
