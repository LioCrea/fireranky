export type UserRole = 'sales' | 'company';

export type FireRankyUser = {
  email: string;
  role: UserRole;
};

const USER_KEY = 'fireranky_user';
const ACCOUNTS_KEY = 'fireranky_accounts';

export function getCurrentUser(): FireRankyUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as FireRankyUser; } catch { return null; }
}

export function signUp(email: string, password: string, role: UserRole): FireRankyUser {
  if (typeof window === 'undefined') throw new Error('Browser only');
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) || '{}') as Record<string, { password: string; role: UserRole }>;
  if (accounts[normalizedEmail]) throw new Error('An account already exists with this email.');
  accounts[normalizedEmail] = { password, role };
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  const user = { email: normalizedEmail, role };
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function signIn(email: string, password: string): FireRankyUser {
  if (typeof window === 'undefined') throw new Error('Browser only');
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) || '{}') as Record<string, { password: string; role: UserRole }>;
  const account = accounts[normalizedEmail];
  if (!account || account.password !== password) throw new Error('Invalid email or password.');
  const user = { email: normalizedEmail, role: account.role };
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function signOut() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(USER_KEY);
}
