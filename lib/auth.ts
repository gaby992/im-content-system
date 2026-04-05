import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { User } from '@/types';
export { TEAM_CREDENTIALS } from '@/lib/constants';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'im-content-system-secret-key-2025'
);

const USERS: Record<string, { password: string; role: User['role'] }> = {
  gabby: { password: 'infinite2025', role: 'admin' },
  freymar: { password: 'freymar2025', role: 'editor' },
  doe: { password: 'doe2025', role: 'viewer' },
};

export async function signToken(user: User): Promise<string> {
  return new SignJWT({ username: user.username, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { username: payload.username as string, role: payload.role as User['role'] };
  } catch {
    return null;
  }
}

export function validateCredentials(username: string, password: string): User | null {
  const user = USERS[username.toLowerCase()];
  if (!user || user.password !== password) return null;
  return { username: username.toLowerCase(), role: user.role };
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
