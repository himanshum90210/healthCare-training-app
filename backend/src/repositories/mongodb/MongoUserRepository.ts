import { isValidObjectId } from "mongoose";
import type { IUserRepository } from "../interfaces/IUserRepository";
import { UserModel, type UserDocument } from "../../models/user.model";
import type { CreateUserInput, User, UserWithPassword } from "../../types/user";

function toUser(doc: UserDocument): User {
  return {
    id: doc.id,
    email: doc.email,
    firstName: doc.firstName,
    lastName: doc.lastName,
    role: doc.role,
    isActive: doc.isActive,
    lastLoginAt: doc.lastLoginAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await UserModel.findById(id);
    return doc ? toUser(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: normalizeEmail(email) });
    return doc ? toUser(doc) : null;
  }

  async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
    const doc = await UserModel.findOne({ email: normalizeEmail(email) }).select("+passwordHash");
    return doc ? { ...toUser(doc), passwordHash: doc.passwordHash } : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const doc = await UserModel.create(input);
    return toUser(doc);
  }

  async updateLastLogin(id: string, at: Date): Promise<void> {
    await UserModel.updateOne({ _id: id }, { lastLoginAt: at });
  }
}