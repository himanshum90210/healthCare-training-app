import type { CookieOptions, Request, Response } from "express";
import { Config } from "../config/config";
import { AuthService, type AuthResult } from "../services/AuthService";
import { UnauthorizedError } from "../errors";
import type { LoginInput } from "../validators/auth.validators";

const REFRESH_COOKIE = "refreshToken";

export class AuthController {
    constructor(private readonly authService: AuthService) { }

    private cookieOptions(): CookieOptions {
        return {
            httpOnly: true, // not readable from JavaScript
            secure: Config.getInstance().isProduction, // HTTPS only in production
            sameSite: "strict",
            path: "/api/auth", // the browser only sends it to auth endpoints
        };
    }

    private setRefreshCookie(res: Response, result: AuthResult): void {
        res.cookie(REFRESH_COOKIE, result.refreshToken, {
            ...this.cookieOptions(),
            expires: result.refreshTokenExpiresAt,
        });
    }

    login = async (req: Request, res: Response): Promise<void> => {
        const { email, password } = req.body as LoginInput;
        const result = await this.authService.login(email, password);
        this.setRefreshCookie(res, result);
        res.status(200).json({
            success: true,
            data: { user: result.user, accessToken: result.accessToken },
        });
    };

    refresh = async (req: Request, res: Response): Promise<void> => {
        const raw: string | undefined = req.cookies?.[REFRESH_COOKIE];
        if (!raw) {
            throw new UnauthorizedError("Refresh token missing", "REFRESH_TOKEN_MISSING");
        }
        const result = await this.authService.refresh(raw);
        this.setRefreshCookie(res, result);
        res.status(200).json({
            success: true,
            data: { user: result.user, accessToken: result.accessToken },
        });
    };

    logout = async (req: Request, res: Response): Promise<void> => {
        const raw: string | undefined = req.cookies?.[REFRESH_COOKIE];
        await this.authService.logout(raw);
        res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
        res.status(200).json({ success: true, message: "Logged out" });
    };

    me = async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new UnauthorizedError("Authentication required", "AUTH_REQUIRED");
        }

        const user = await this.authService.getProfile(req.user.id)
        res.status(200).json({ success: true, data: { user } });
    }
}