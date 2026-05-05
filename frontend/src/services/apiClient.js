import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { STORAGE_KEYS } from "../constants/auth";
import { getSecureItem } from "../utils/storage";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const forceRemoteApi = process.env.EXPO_PUBLIC_USE_REMOTE_API === "true";
const isDevRuntime = typeof __DEV__ !== "undefined" && __DEV__;

function getExpoHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost ||
    "";

  return hostUri.split(":")[0];
}

function getApiBaseUrl() {
  if (apiUrl && (!isDevRuntime || forceRemoteApi)) {
    return apiUrl;
  }

  if (Platform.OS === "web") {
    return "http://127.0.0.1:5000/api";
  }

  const expoHost = getExpoHost();

  if (expoHost) {
    return `http://${expoHost}:5000/api`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000/api";
  }

  return "http://127.0.0.1:5000/api";
}

export const API_BASE_URL = getApiBaseUrl();

export const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

const PUBLIC_AUTH_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/send-otp",
  "/auth/verify-otp",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

const apiClient = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ""),
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getSecureItem(STORAGE_KEYS.authToken);
  const requestPath = config.url || "";

  if (token && !PUBLIC_AUTH_PATHS.has(requestPath)) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error?.response?.data || error)
);

export default apiClient;
