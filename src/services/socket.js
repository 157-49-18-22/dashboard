import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

export const connectSocket = (agentId) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { agentId },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket.id);
    if (agentId) socket.emit("agent:join", agentId);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected");
  });

  socket.on("connect_error", (err) => {
    console.warn("Socket connection error:", err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinQueryRoom = (queryId) => {
  socket?.emit("query:join", queryId);
};

export const leaveQueryRoom = (queryId) => {
  socket?.emit("query:leave", queryId);
};

export const emitTyping = (queryId, agentName) => {
  socket?.emit("agent:typing", { queryId, agentName });
};

export const emitStopTyping = (queryId) => {
  socket?.emit("agent:stopTyping", { queryId });
};
