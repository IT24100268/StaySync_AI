import { ROLES } from "../constants/auth";
import { getSecureItem, setSecureItem } from "../utils/storage";

const STUDENT_PROFILE_CACHE_KEY = "staysync_student_profile_cache_v1";

function getStudentCacheKeys(user = {}) {
  const keys = [];

  if (user?.id) {
    keys.push(`id:${user.id}`);
  }

  if (user?.email) {
    keys.push(`email:${user.email.toLowerCase()}`);
  }

  return keys;
}

async function readStudentProfileCache() {
  const storedValue = await getSecureItem(STUDENT_PROFILE_CACHE_KEY);

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

export async function hydrateStudentProfile(user) {
  if (!user || user.role !== ROLES.STUDENT) {
    return user;
  }

  const cache = await readStudentProfileCache();
  const matchingKey = getStudentCacheKeys(user).find((key) => cache[key]);

  if (!matchingKey) {
    return user;
  }

  const cachedProfile = cache[matchingKey];

  return {
    ...user,
    ...cachedProfile,
    id: user.id || cachedProfile.id,
    role: user.role || cachedProfile.role,
    email: user.email || cachedProfile.email,
  };
}

export async function saveStudentProfile(user) {
  if (!user || user.role !== ROLES.STUDENT) {
    return user;
  }

  const cache = await readStudentProfileCache();
  const nextCache = { ...cache };

  getStudentCacheKeys(user).forEach((key) => {
    nextCache[key] = user;
  });

  await setSecureItem(STUDENT_PROFILE_CACHE_KEY, JSON.stringify(nextCache));
  return user;
}
