const getStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const readStorageValue = (key, fallback = null) => {
  const storage = getStorage();
  if (!storage) {
    return fallback;
  }

  try {
    const value = storage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
};

export const writeStorageValue = (key, value) => {
  const storage = getStorage();
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const readStorageJSON = (key, fallback) => {
  const raw = readStorageValue(key, null);
  if (raw === null || raw === '') {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

export const writeStorageJSON = (key, value) => writeStorageValue(key, JSON.stringify(value));
