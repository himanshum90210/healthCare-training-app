import argon2 from "argon2";
import type { IUserRepository } from "../repositories/interfaces/IUserRepository";
import type { IRefreshTokenRepository } from "../repositories/interfaces/IRefreshTokenRepository";
import { TokenService } from "./TokenService";
import { ForbiddenError, UnauthorizedError } from "../errors";
import type { User } from "../types/user";

export interface AuthResult {
    user: User;
    accessToken: string;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
}

export class AuthService {
    // Verified against when the email is unknown, so response time doesn't reveal which emails exist
    private readonly dummyHash: Promise<string> = argon2.hash("timing-dummy-password");

    constructor(
        private readonly users: IUserRepository,
        private readonly refreshTokens: IRefreshTokenRepository,
        private readonly tokens: TokenService
    ) { }

    async login(email: string, password: string): Promise<AuthResult> {
        const found = await this.users.findByEmailWithPassword(email);
        const hash = found?.passwordHash ?? (await this.dummyHash);
        const passwordOk = await argon2.verify(hash, password);

        if (!found || !passwordOk) {
            throw new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
        }
        if (!found.isActive) {
            throw new ForbiddenError("Account is deactivated", "ACCOUNT_DISABLED");
        }

        const { passwordHash: _passwordHash, ...user } = found;
        // await this.users.updateLastLogin(user.id, new Date());
        // return this.issueTokens(user);
        const now = new Date();
        await this.users.updateLastLogin(user.id, now);
        return this.issueTokens({ ...user, lastLoginAt: now });
    }

    async refresh(rawRefreshToken: string): Promise<AuthResult> {
        const { sub } = this.tokens.verifyRefreshToken(rawRefreshToken);
        const record = await this.refreshTokens.findByHash(this.tokens.hashToken(rawRefreshToken));

        if (!record || record.userId !== sub) {
            throw new UnauthorizedError("Invalid refresh token", "INVALID_REFRESH_TOKEN");
        }

        const revoked = await this.refreshTokens.revokeIfActive(record.id);
        if (!revoked) {
            // A token that was already used is being presented again: assume theft
            await this.refreshTokens.revokeAllForUser(sub);
            throw new UnauthorizedError(
                "Refresh token reuse detected. Please log in again.",
                "REFRESH_TOKEN_REUSED"
            );
        }

        const user = await this.users.findById(sub);
        if (!user || !user.isActive) {
            throw new UnauthorizedError("Account unavailable", "INVALID_REFRESH_TOKEN");
        }
        return this.issueTokens(user);
    }

    async logout(rawRefreshToken?: string): Promise<void> {
        if (!rawRefreshToken) return;
        const record = await this.refreshTokens.findByHash(this.tokens.hashToken(rawRefreshToken));
        if (record) await this.refreshTokens.revokeIfActive(record.id);
    }

    private async issueTokens(user: User): Promise<AuthResult> {
        const accessToken = this.tokens.signAccessToken(user.id, user.role);
        const { token, expiresAt } = this.tokens.signRefreshToken(user.id);

        await this.refreshTokens.create({
            userId: user.id,
            tokenHash: this.tokens.hashToken(token),
            expiresAt,
        });

        return { user, accessToken, refreshToken: token, refreshTokenExpiresAt: expiresAt };
    }

    async getProfile(userId: string): Promise<User> {
        const user = await this.users.findById(userId);
        if(!user || !user.isActive) {
            throw new UnauthorizedError("Account unavailable", "ACCOUNT_UNAVAILABLE");
        }
        return user;
    }
}