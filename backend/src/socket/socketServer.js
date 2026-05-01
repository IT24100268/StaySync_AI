const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");

let io;

function userRoom(userId) {
  return `user:${userId}`;
}

function getAuthToken(socket) {
  const authToken = socket.handshake.auth?.token;

  if (authToken) {
    return authToken;
  }

  const header = socket.handshake.headers?.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = getAuthToken(socket);

      if (!token) {
        return next(new Error("Authentication token is required."));
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.sub).select("-password");

      if (!user) {
        return next(new Error("Invalid authentication token."));
      }

      socket.data.user = user;
      return next();
    } catch (error) {
      return next(new Error("Socket authentication failed."));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    if (user?._id) {
      socket.join(userRoom(String(user._id)));
    }
  });

  return io;
}

function emitToUser(userId, eventName, payload) {
  if (!io) {
    return;
  }

  io.to(userRoom(String(userId))).emit(eventName, payload);
}

module.exports = {
  initSocket,
  emitToUser,
};
