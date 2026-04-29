import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { readDb, writeDb } from './db.js';
import { NotFoundError, ValidationError } from './errors.js';
import type { AuthResponse, LoginInput, PublicUser, RegisterInput, Session, User } from './types.js';

const scryptAsync = promisify(crypto.scrypt);
const SESSION_TTL_DAYS = 30;

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function addDays(dateIso: string, days: number): string {
  const date = new Date(dateIso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function assertValidCredentials(input: { username: string; password: string }): void {
  if (!input.username?.trim()) {
    throw new ValidationError('Username is required.');
  }

  if (!input.password || input.password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters.');
  }
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) {
    return false;
  }

  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(key, 'hex');

  if (expected.length !== hash.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, hash);
}

function createSession(userId: string): Session {
  const createdAt = nowIso();
  return {
    token: crypto.randomBytes(48).toString('hex'),
    userId,
    createdAt,
    expiresAt: addDays(createdAt, SESSION_TTL_DAYS),
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  assertValidCredentials(input);

  const db = await readDb();
  const username = normalizeUsername(input.username);
  const duplicate = db.users.find((user) => user.username === username);
  if (duplicate) {
    throw new ValidationError('Username already exists.');
  }

  const now = nowIso();
  const user: User = {
    id: newId(),
    username,
    passwordHash: await hashPassword(input.password),
    createdAt: now,
    updatedAt: now,
  };

  const session = createSession(user.id);
  db.users.push(user);
  db.sessions.push(session);
  db.loginRecords.push({
    id: newId(),
    userId: user.id,
    username: user.username,
    loggedInAt: now,
  });

  await writeDb(db);

  return {
    token: session.token,
    user: toPublicUser(user),
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  assertValidCredentials(input);

  const db = await readDb();
  const username = normalizeUsername(input.username);
  const user = db.users.find((item) => item.username === username);

  if (!user) {
    throw new ValidationError('Invalid username or password.');
  }

  const passOk = await verifyPassword(input.password, user.passwordHash);
  if (!passOk) {
    throw new ValidationError('Invalid username or password.');
  }

  const now = nowIso();
  user.lastLoginAt = now;
  user.updatedAt = now;

  const session = createSession(user.id);
  db.sessions.push(session);
  db.loginRecords.push({
    id: newId(),
    userId: user.id,
    username: user.username,
    loggedInAt: now,
  });

  await writeDb(db);

  return {
    token: session.token,
    user: toPublicUser(user),
  };
}

export async function getUserByToken(token: string): Promise<PublicUser> {
  const db = await readDb();
  const now = nowIso();

  db.sessions = db.sessions.filter((session) => session.expiresAt > now);

  const session = db.sessions.find((item) => item.token === token);
  if (!session) {
    await writeDb(db);
    throw new NotFoundError('Session not found.');
  }

  const user = db.users.find((item) => item.id === session.userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  await writeDb(db);
  return toPublicUser(user);
}

export async function logout(token: string): Promise<void> {
  const db = await readDb();
  const before = db.sessions.length;
  db.sessions = db.sessions.filter((item) => item.token !== token);

  if (db.sessions.length !== before) {
    await writeDb(db);
  }
}

export async function authenticateToken(token: string): Promise<User> {
  const db = await readDb();
  const now = nowIso();

  db.sessions = db.sessions.filter((session) => session.expiresAt > now);
  const session = db.sessions.find((item) => item.token === token);

  if (!session) {
    await writeDb(db);
    throw new ValidationError('Unauthorized.');
  }

  const user = db.users.find((item) => item.id === session.userId);
  if (!user) {
    throw new ValidationError('Unauthorized.');
  }

  await writeDb(db);
  return user;
}
