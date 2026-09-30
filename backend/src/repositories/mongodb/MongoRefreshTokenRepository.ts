import { isValidObjectId } from "mongoose";
import type { IRefreshTokenRepository } from "../interfaces/IRefreshTokenRepository";
import { RefreshTokenModel, type RefreshTokenDocument } from "../../models/refreshToken.model";
import type { CreateRefreshTokenInput, RefreshTokenRecord } from "../../types/refreshToken";

function toRecord(doc: RefreshTokenDocument): RefreshTokenRecord {
  return {
    id: doc.id,
    userId: doc.userId.toString(),
    tokenHash: doc.tokenHash,
    expiresAt: doc.expiresAt,
    revokedAt: doc.revokedAt ?? null,
  };
}

export class MongoRefreshTokenRepository implements IRefreshTokenRepository {
  async create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord> {
    const doc = await RefreshTokenModel.create(input);
    return toRecord(doc);
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const doc = await RefreshTokenModel.findOne({ tokenHash });
    return doc ? toRecord(doc) : null;
  }

  async revokeIfActive(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    const result = await RefreshTokenModel.updateOne(
      { _id: id, revokedAt: null },
      { revokedAt: new Date() }
    );
    return result.modifiedCount === 1;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    if (!isValidObjectId(userId)) return;
    await RefreshTokenModel.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
  }
}