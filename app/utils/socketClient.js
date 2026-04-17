"use client";

import { io } from "socket.io-client";
import { serverurl } from "./constants/serverurl";

let sharedSocket = null;

export const getSocketOrigin = () => {
  try {
    return new URL(serverurl).origin;
  } catch {
    return serverurl || "";
  }
};

export const getSharedSocket = () => {
  if (sharedSocket) return sharedSocket;
  const origin = getSocketOrigin();
  if (!origin) return null;

  sharedSocket = io(origin, {
    transports: ["websocket", "polling"],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 4000,
    timeout: 20000,
  });

  return sharedSocket;
};

