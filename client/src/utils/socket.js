// src/utils/socket.js
import { io } from "socket.io-client";

export const socket = io("http://localhost:5000", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
