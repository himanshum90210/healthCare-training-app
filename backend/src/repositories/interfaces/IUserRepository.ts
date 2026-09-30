import type { CreateUserInput, User, UserWithPassword } from "../../types/user";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailWithPassword(email: string): Promise<UserWithPassword | null>;
  create(input: CreateUserInput): Promise<User>;
  updateLastLogin(id: string, at: Date): Promise<void>;
}