function getWebStorage() {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }

  return window.localStorage;
}

export async function setSecureItem(key, value) {
  const storage = getWebStorage();

  if (storage) {
    storage.setItem(key, value);
  }
}

export async function getSecureItem(key) {
  const storage = getWebStorage();
  return storage ? storage.getItem(key) : null;
}

export async function deleteSecureItem(key) {
  const storage = getWebStorage();

  if (storage) {
    storage.removeItem(key);
  }
}
