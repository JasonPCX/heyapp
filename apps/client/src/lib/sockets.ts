import { io } from "socket.io-client";
import { ENV } from "./env";
import { getAuthToken } from "@/services/tokenService";

export const socket = io(ENV.VITE_SOCKET_URL, {
  autoConnect: false,
});

export function connectSocket() {
  socket.auth = { token: getAuthToken() };
  socket.connect();
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}

if (ENV.MODE !== "production") {
  socket.onAny((event, ...args) => {
    console.log(event, args);
  });

  socket.onAnyOutgoing((event, ...args) => {
    console.log(event, args);
  });
}

export default socket;
