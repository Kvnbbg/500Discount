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
  return btoa(binary);
};

export const normalizeEmail = (email) => email.trim().toLowerCase();

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
    const normalizedEmail = normalizeEmail(email);
    const users = readUsers();

    if (users.some((user) => user.email === normalizedEmail)) {
      return { ok: false, reason: 'exists' };
    }

    const passwordHash = await hashPassword(password);
    const newUser = {
      name,
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
    const normalizedEmail = normalizeEmail(email);
    const users = readUsers();
    const index = users.findIndex((user) => user.email === normalizedEmail);
    if (index === -1) {
      return { ok: false, reason: 'missing' };
    }

    const updatedUser = {
      ...users[index],
      name,
      updatedAt: new Date().toISOString(),
    };
    users[index] = updatedUser;
    writeUsers(users);

    const session = getSession();
    if (session?.email === normalizedEmail) {
      const updatedSession = { ...session, name };
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
