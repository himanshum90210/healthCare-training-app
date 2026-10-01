import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { Config } from "../config/config";
import { UnauthorizedError } from "../errors";
import type { TokenService } from "../services/TokenService";
import type { IRealtimePublisher } from "./IRealtimePublisher";

const roomFor = (userId: string): string => `user:${userId}`;

/** Socket.IO surfaces `err.data` to the client's connect_error handler */
function authError(code: string, message: string): Error {
  const err = new Error(message) as Error & { data?: { code: string } };
  err.data = { code };
  return err;
}

export class SocketManager implements IRealtimePublisher {
  private static instance: SocketManager;
  private io: Server | null = null;

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public init(httpServer: HttpServer, tokens: TokenService): void {
    if (this.io) return;

    const io = new Server(httpServer, {
      cors: { origin: Config.getInstance().corsOrigin },
    });

    // Handshake authentication: no valid access token, no connection
    io.use((socket, next) => {
      const token: unknown = socket.handshake.auth?.token;
      if (typeof token !== "string" || token.length === 0) {
        return next(authError("AUTH_REQUIRED", "Authentication required"));
      }
      try {
        const payload = tokens.verifyAccessToken(token);
        socket.data.user = { id: payload.sub, role: payload.role, exp: payload.exp };
        next();
      } catch (err) {
        next(authError(err instanceof UnauthorizedError ? err.code : "INVALID_TOKEN", "Authentication failed"));
      }
    });

    io.on("connection", (socket) => {
      const user = socket.data.user as { id: string; exp: number };
      void socket.join(roomFor(user.id));

      // Don't outlive the access token: the client refreshes and reconnects
      const timer = setTimeout(() => socket.disconnect(true), Math.max(0, user.exp * 1000 - Date.now()));
      socket.on("disconnect", () => clearTimeout(timer));
    });

    this.io = io;
  }

  public emitToUser(userId: string, event: string, payload: unknown): void {
    this.io?.to(roomFor(userId)).emit(event, payload); // safe no-op before init()
  }

  public disconnectAll(): void {
    this.io?.disconnectSockets(true);
  }
}