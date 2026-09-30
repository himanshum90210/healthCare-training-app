import dotenv from "dotenv";
import {z} from "zod";
import { IANAZone } from "luxon";
dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    MONGO_URI: z.string().min(1, "MONGO_URI is required"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: z.string().min(32,"JWT_REFRESH_SECRET must be at least 32 characters"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    CLINIC_TIMEZONE: z.string().default("Asia/Kolkata").refine((tz) => IANAZone.isValidZone(tz), "Must be a valid IANA time zone, e.g. Asia"),
});

export type ENV = z.infer<typeof envSchema>;

export class Config {
    private static instance : Config;

    public readonly nodeEnv: ENV["NODE_ENV"];
    public readonly port: number;
    public readonly mongoUri: string;
    public readonly jwtSecret: string;
    public readonly jwtRefreshSecret: string;
    public readonly jwtExpiresIn: string;
    public readonly refreshTokenExpiresIn: string;
    public readonly corsOrigin: string;
    public readonly clinicTimezone: string;

    private constructor () {
        const result = envSchema.safeParse(process.env);

        if(!result.success) {
            const details = result.error.issues.map((issue) => `    -${issue.path.join(".")}: ${issue.message}`).join("\n");
            throw new Error(`Invalid environment configuration: \n${details}`);
        }

        const env = result.data;

        this.nodeEnv = env.NODE_ENV;
        this.port = env.PORT;
        this.mongoUri = env.MONGO_URI;
        this.jwtSecret = env.JWT_SECRET;
        this.jwtRefreshSecret = env.JWT_REFRESH_SECRET;
        this.jwtExpiresIn = env.JWT_EXPIRES_IN;
        this.refreshTokenExpiresIn = env.REFRESH_TOKEN_EXPIRES_IN;
        this.corsOrigin = env.CORS_ORIGIN;
        this.clinicTimezone = env.CLINIC_TIMEZONE;
    }


    public static getInstance():Config {
        if(!Config.instance) {
            Config.instance = new Config()
        }
        return Config.instance;
    }

    public get isProduction(): boolean {
        return this.nodeEnv === "production";
    }

    public get isDevelopment(): boolean {
        return this.nodeEnv === "development"
    }
}