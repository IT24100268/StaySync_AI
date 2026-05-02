import { getSecureItem, setSecureItem } from "../../../utils/storage";

const OWNER_PROFILE_CACHE_KEY = "staysync_owner_profile_cache_v1";

function getOwnerCacheKeys(owner = {}) {
  const keys = [];

  if (owner?.id) {
    keys.push(`id:${owner.id}`);
  }

  if (owner?.email) {
    keys.push(`email:${owner.email.toLowerCase()}`);
  }

  return keys;
}

async function readOwnerProfileCache() {
  const storedValue = await getSecureItem(OWNER_PROFILE_CACHE_KEY);

  if (!storedValue) {
    return {};
  }

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    void error;
    return {};
  }
}

export async function hydrateOwnerProfile(owner) {
  if (!owner) {
    return owner;
  }

  const cache = await readOwnerProfileCache();
  const matchingKey = getOwnerCacheKeys(owner).find((key) => cache[key]);

  if (!matchingKey) {
    return owner;
  }

  const cachedProfile = cache[matchingKey];

  return {
    ...owner,
    ...cachedProfile,
    id: owner.id || cachedProfile.id,
    email: owner.email || cachedProfile.email,
    role: owner.role || cachedProfile.role,
  };
}

export async function saveOwnerProfile(owner) {
  if (!owner) {
    return owner;
  }

  const cache = await readOwnerProfileCache();
  const nextCache = { ...cache };

  getOwnerCacheKeys(owner).forEach((key) => {
    nextCache[key] = owner;
  });

  await setSecureItem(OWNER_PROFILE_CACHE_KEY, JSON.stringify(nextCache));
  return owner;
}
