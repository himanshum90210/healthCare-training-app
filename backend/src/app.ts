import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { Config } from "./config/config";
import { Database } from "./config/database";
import {errorHandler, notFoundHandler} from "./middleware/errorHandler";
import { ConflictError, ForbiddenError } from "./errors";
import { authController, authenticate } from "./container";
import { createAuthRouter } from "./routes/auth.routes";
import {createAdminRouter} from "./routes/admin.routes";
import {doctorController} from "./container";
import { createDoctorRouter } from "./routes/doctor.routes";




export function createApp(): Application {
    const app = express();

    app.use(helmet());
    const config = Config.getInstance();
    app.use(
        cors({
            origin: config.corsOrigin,
            credentials: true,
        })
    );

    app.use(express.json({ limit: "1mb" }));
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.get("/health", (_req: Request, res: Response) => {
        const dbUp = Database.getInstance().isConnected();

        res.status(dbUp ? 200 : 300).json({
            success: dbUp,
            message: "Healthcare Training Backend is Running",
            timestamp: new Date().toISOString(),
            database: dbUp ? "Up" : "Down",
        });
    });

    app.get("/test/conflict", () => {
        throw new ConflictError("Appointment slot is no longer available", "APPOINTMENT_CONFLICT");
    })

    app.get("/test/forbidden", () => {
        throw new ForbiddenError();
    })

    app.get("/test/crash", () => {
        throw new Error("boom")
    })

    // app.use((req: Request, res: Response) => {
    //     res.status(404).json({
    //         success: false,
    //         message: `Route not found: ${req.method} ${req.originalUrl}`,
    //         code: "NOT_FOUND"
    //     });
    // });

    // app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    //     console.error(err);
    //     res.status(500).json({
    //         success: false,
    //         message: "Internal Server error",
    //         code: "INTERNAL_ERROR"
    //     });
    // });
    app.use("/api/admin", createAdminRouter(authenticate))
    app.use("/api/auth", createAuthRouter(authController, authenticate));
    app.use("/api/doctors", createDoctorRouter(doctorController, authenticate));
    app.use(notFoundHandler);
    app.use(errorHandler)

    return app;
}