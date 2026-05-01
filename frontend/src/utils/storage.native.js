import * as SecureStore from "expo-secure-store";

export async function setSecureItem(key, value) {
  await SecureStore.setItemAsync(key, value);
}

export async function getSecureItem(key) {
  return SecureStore.getItemAsync(key);
}

export async function deleteSecureItem(key) {
  await SecureStore.deleteItemAsync(key);
}
