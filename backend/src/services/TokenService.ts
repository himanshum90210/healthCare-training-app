import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { createHash, randomUUID } from "crypto";
import { Config } from "../config/config";
import { UnauthorizedError } from "../errors";
import { ROLES, type Role } from "../types/role";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export class TokenService {
  private get config(): Config {
    return Config.getInstance();
  }

  signAccessToken(userId: string, role: Role): string {
    return jwt.sign({ role }, this.config.jwtSecret, {
      subject: userId,
      algorithm: "HS256",
      expiresIn: this.config.jwtExpiresIn as SignOptions["expiresIn"],
    });
  }

  signRefreshToken(userId: string): { token: string; expiresAt: Date } {
    const token = jwt.sign({}, this.config.jwtRefreshSecret, {
      subject: userId,
      jwtid: randomUUID(), // makes every refresh token unique
      algorithm: "HS256",
      expiresIn: this.config.refreshTokenExpiresIn as SignOptions["expiresIn"],
    });
    const { exp } = jwt.decode(token) as JwtPayload;
    return { token, expiresAt: new Date((exp as number) * 1000) };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const decoded = this.verify(token, this.config.jwtSecret);
    if (!(ROLES as readonly string[]).includes(decoded.role)) {
      throw new UnauthorizedError("Invalid token", "INVALID_TOKEN");
    }
    return { sub: decoded.sub as string, role: decoded.role as Role };
  }

  verifyRefreshToken(token: string): { sub: string } {
    const decoded = this.verify(token, this.config.jwtRefreshSecret);
    return { sub: decoded.sub as string };
  }

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private verify(token: string, secret: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
      if (typeof decoded === "string" || typeof decoded.sub !== "string") {
        throw new UnauthorizedError("Invalid token", "INVALID_TOKEN");
      }
      return decoded;
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError("Token expired", "TOKEN_EXPIRED"); // frontend uses this to trigger a refresh
      }
      throw new UnauthorizedError("Invalid token", "INVALID_TOKEN");
    }
  }
}