import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAuthStore, hashPassword } from '../assets/js/utils/auth-store.js';
import { readStorageJSON, writeStorageJSON } from '../assets/js/utils/storage.js';

const createLocalStorageMock = () => {
  const store = new Map();
  return {
    clear: () => store.clear(),
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    removeItem: (key) => store.delete(key),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
};

const ensureBtoa = () => {
  if (!globalThis.btoa) {
    globalThis.btoa = (value) => Buffer.from(value, 'binary').toString('base64');
  }
};

describe('auth store CRUD flows', () => {
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    ensureBtoa();
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true,
    });

    const localStorage = createLocalStorageMock();
    globalThis.window = { localStorage };
    localStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });
  });

  it('hashes passwords deterministically when crypto.subtle is unavailable', async () => {
    const hashA = await hashPassword('quantum-pass');
    const hashB = await hashPassword('quantum-pass');
    expect(hashA).toBe(hashB);
  });

  it('registers, authenticates, updates, and deletes a user profile', async () => {
    const store = createAuthStore();

    const registration = await store.registerUser({
      name: 'Nova',
      email: 'Nova@Example.com',
      password: 'supersecure',
    });

    expect(registration.ok).toBe(true);
    expect(registration.session?.email).toBe('nova@example.com');

    const duplicate = await store.registerUser({
      name: 'Nova',
      email: 'nova@example.com',
      password: 'supersecure',
    });
    expect(duplicate.ok).toBe(false);
    expect(duplicate.reason).toBe('exists');

    const loginFailure = await store.authenticateUser({
      email: 'nova@example.com',
      password: 'wrong-pass',
    });
    expect(loginFailure.ok).toBe(false);

    const loginSuccess = await store.authenticateUser({
      email: 'nova@example.com',
      password: 'supersecure',
    });
    expect(loginSuccess.ok).toBe(true);

    const updated = store.updateProfile({
      email: 'nova@example.com',
      name: 'Nova Prime',
    });
    expect(updated.ok).toBe(true);
    expect(store.getSession()?.name).toBe('Nova Prime');

    const deletion = store.deleteProfile('nova@example.com');
    expect(deletion.ok).toBe(true);
    expect(store.getSession()).toBeNull();
  });
});

describe('storage JSON helpers', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();
    globalThis.window = { localStorage };
    localStorage.clear();
  });

  it('returns fallback when stored JSON is invalid', () => {
    globalThis.window.localStorage.setItem('bad-json', '{');
    expect(readStorageJSON('bad-json', [])).toEqual([]);
  });

  it('persists JSON payloads safely', () => {
    writeStorageJSON('payload', { level: 5 });
    expect(readStorageJSON('payload', null)).toEqual({ level: 5 });
  });
});
