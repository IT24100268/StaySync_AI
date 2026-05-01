import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "./apiClient";

let socket;
let currentToken = null;

export function connectSocket(token) {
  if (!token) {
    return null;
  }

  if (socket && currentToken === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  currentToken = token;
  socket = io(SOCKET_BASE_URL, {
    transports: ["websocket", "polling"],
    auth: { token },
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
  }

  socket = null;
  currentToken = null;
}
