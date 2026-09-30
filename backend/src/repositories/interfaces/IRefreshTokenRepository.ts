import type { CreateRefreshTokenInput, RefreshTokenRecord } from "../../types/refreshToken";

export interface IRefreshTokenRepository {
  create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord>;
  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  /** Atomically revokes the token. Returns false if it was already revoked. */
  revokeIfActive(id: string): Promise<boolean>;
  revokeAllForUser(userId: string): Promise<void>;
}