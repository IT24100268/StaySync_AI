import { Platform } from "react-native";

export function blurActiveElement() {
  if (Platform.OS !== "web") {
    return;
  }

  if (typeof document === "undefined" || !document.activeElement) {
    return;
  }

  const activeElement = document.activeElement;
  if (typeof activeElement.blur === "function") {
    activeElement.blur();
  }
}
