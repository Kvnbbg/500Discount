import { readStorageJSON, writeStorageJSON, writeStorageValue } from './storage.js';

const USERS_KEY = 'authUsers';
const SESSION_KEY = 'authSession';

const base64Encode = (value) => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(binary);
  }

  if (typeof globalThis.Buffer !== 'undefined') {
    return globalThis.Buffer.from(binary, 'binary').toString('base64');
  }

  throw new Error('No base64 encoder available.');
};

export const normalizeEmail = (email) => {
  if (typeof email !== 'string') {
    return '';
  }

  return email.trim().toLowerCase();
};

const normalizeName = (name) => (typeof name === 'string' ? name.trim() : '');
const AUTH_MINIMUM_PASSWORD_LENGTH = 8;
const isValidPassword = (password) =>
  typeof password === 'string' && password.length >= AUTH_MINIMUM_PASSWORD_LENGTH;

export const hashPassword = async (password) => {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await cryptoApi.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  return base64Encode(password).split('').reverse().join('');
};

const readUsers = () => {
  const users = readStorageJSON(USERS_KEY, []);
  return Array.isArray(users) ? users : [];
};

const writeUsers = (users) => writeStorageJSON(USERS_KEY, users);

const getSession = () => {
  const session = readStorageJSON(SESSION_KEY, null);
  return session && typeof session === 'object' ? session : null;
};

const setSession = (session) => writeStorageJSON(SESSION_KEY, session);

const clearSession = () => writeStorageValue(SESSION_KEY, '');

const createSession = ({ name, email }) => ({
  name,
  email,
  signedInAt: new Date().toISOString(),
});

export const createAuthStore = () => {
  const findUserByEmail = (email) => readUsers().find((user) => user.email === email);

  const registerUser = async ({ name, email, password }) => {
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);
    if (normalizedName.length === 0 || normalizedEmail.length === 0 || !isValidPassword(password)) {
      return { ok: false, reason: 'invalid-input' };
    }

    const users = readUsers();

    if (users.some((user) => user.email === normalizedEmail)) {
      return { ok: false, reason: 'exists' };
    }

    const passwordHash = await hashPassword(password);
    const newUser = {
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsers(users);
    const session = createSession(newUser);
    setSession(session);

    return { ok: true, session };
  };

  const authenticateUser = async ({ email, password }) => {
    const normalizedEmail = normalizeEmail(email);
    if (normalizedEmail.length === 0 || !isValidPassword(password)) {
      return { ok: false, reason: 'invalid' };
    }

    const user = findUserByEmail(normalizedEmail);
    if (!user) {
      return { ok: false, reason: 'invalid' };
    }

    const passwordHash = await hashPassword(password);
    if (passwordHash !== user.passwordHash) {
      return { ok: false, reason: 'invalid' };
    }

    const session = createSession(user);
    setSession(session);
    return { ok: true, session };
  };

  const updateProfile = ({ email, name }) => {
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);
    if (normalizedEmail.length === 0 || normalizedName.length === 0) {
      return { ok: false, reason: 'invalid-input' };
    }

    const users = readUsers();
    const index = users.findIndex((user) => user.email === normalizedEmail);
    if (index === -1) {
      return { ok: false, reason: 'missing' };
    }

    const updatedUser = {
      ...users[index],
      name: normalizedName,
      updatedAt: new Date().toISOString(),
    };
    users[index] = updatedUser;
    writeUsers(users);

    const session = getSession();
    if (session?.email === normalizedEmail) {
      const updatedSession = { ...session, name: normalizedName };
      setSession(updatedSession);
      return { ok: true, session: updatedSession };
    }

    return { ok: true, session: session ?? null };
  };

  const deleteProfile = (email) => {
    const normalizedEmail = normalizeEmail(email);
    const users = readUsers();
    const nextUsers = users.filter((user) => user.email !== normalizedEmail);

    if (nextUsers.length === users.length) {
      return { ok: false, reason: 'missing' };
    }

    writeUsers(nextUsers);
    const session = getSession();
    if (session?.email === normalizedEmail) {
      clearSession();
      return { ok: true, session: null };
    }

    return { ok: true, session };
  };

  return {
    registerUser,
    authenticateUser,
    updateProfile,
    deleteProfile,
    getSession,
    clearSession,
  };
};
