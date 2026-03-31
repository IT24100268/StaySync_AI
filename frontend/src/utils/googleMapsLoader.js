const GOOGLE_MAP_SCRIPT_ID = "google-maps-script";
const GOOGLE_MAP_PROMISE_KEY = "__staySyncGoogleMapsPromise";
const READY_POLL_INTERVAL_MS = 100;
const READY_TIMEOUT_MS = 15000;

export const hasGoogleMapsApiKey = (apiKey) =>
  Boolean(apiKey && apiKey.trim() && apiKey !== "your-google-maps-api-key");

export const isGoogleMapsReady = () => {
  const maps = window.google?.maps;
  return Boolean(
    maps &&
      typeof maps.Map === "function" &&
      typeof maps.Marker === "function" &&
      typeof maps.InfoWindow === "function" &&
      typeof maps.LatLngBounds === "function" &&
      typeof maps.Size === "function" &&
      typeof maps.Point === "function"
  );
};

const delay = (ms) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const ensureGoogleMapsReady = async () => {
  if (isGoogleMapsReady()) {
    return true;
  }

  const maps = window.google?.maps;
  if (!maps || typeof maps.importLibrary !== "function") {
    return false;
  }

  try {
    await maps.importLibrary("maps");
    await maps.importLibrary("marker");
  } catch {
    return false;
  }

  return isGoogleMapsReady();
};

const waitForGoogleMapsReady = async (timeoutMs = READY_TIMEOUT_MS) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ready = await ensureGoogleMapsReady();
    if (ready) return true;
    await delay(READY_POLL_INTERVAL_MS);
  }
  return ensureGoogleMapsReady();
};

const scriptMatchesApiKey = (scriptSrc, apiKey) => {
  if (!scriptSrc) return false;
  if (!scriptSrc.includes("maps.googleapis.com/maps/api/js")) return false;
  const encodedApiKey = encodeURIComponent(apiKey);
  return scriptSrc.includes(`key=${apiKey}`) || scriptSrc.includes(`key=${encodedApiKey}`);
};

const ensureScriptElement = (apiKey) => {
  const existing = document.getElementById(GOOGLE_MAP_SCRIPT_ID);
  if (existing) {
    const src = existing.getAttribute("src") || "";
    if (scriptMatchesApiKey(src, apiKey)) {
      return existing;
    }
    existing.remove();
  }

  const script = document.createElement("script");
  script.id = GOOGLE_MAP_SCRIPT_ID;
  script.async = true;
  script.defer = true;
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
  document.head.appendChild(script);
  return script;
};

const createGoogleMapsPromise = (apiKey) => {
  return new Promise((resolve, reject) => {
    const script = ensureScriptElement(apiKey);
    let settled = false;

    const settle = (error) => {
      if (settled) return;
      settled = true;
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);

      if (error) {
        const activePromise = window[GOOGLE_MAP_PROMISE_KEY];
        if (activePromise) {
          window[GOOGLE_MAP_PROMISE_KEY] = null;
        }
        reject(error);
        return;
      }

      resolve(window.google.maps);
    };

    const onLoad = () => {
      void waitForGoogleMapsReady(4000).then((ready) => {
        if (ready) {
          settle();
          return;
        }
        settle(new Error("Google Maps API loaded but map constructors are unavailable."));
      });
    };

    const onError = () => {
      settle(new Error("Unable to load Google Maps."));
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    void waitForGoogleMapsReady(500).then((ready) => {
      if (ready) {
        settle();
      }
    });

    window.setTimeout(async () => {
      if (settled) return;
      const ready = await waitForGoogleMapsReady(1200);
      if (ready) {
        settle();
      } else {
        settle(new Error("Google Maps failed to initialize. Please refresh and try again."));
      }
    }, READY_TIMEOUT_MS);
  });
};

export const loadGoogleMaps = (apiKey) => {
  if (!hasGoogleMapsApiKey(apiKey)) {
    return Promise.reject(new Error("Google Maps API key is missing. Configure VITE_GOOGLE_MAPS_API_KEY."));
  }

  if (isGoogleMapsReady()) {
    return Promise.resolve(window.google.maps);
  }

  if (window[GOOGLE_MAP_PROMISE_KEY]) {
    return window[GOOGLE_MAP_PROMISE_KEY];
  }

  const promise = createGoogleMapsPromise(apiKey).catch((error) => {
    window[GOOGLE_MAP_PROMISE_KEY] = null;
    throw error;
  });

  window[GOOGLE_MAP_PROMISE_KEY] = promise;
  return promise;
};
