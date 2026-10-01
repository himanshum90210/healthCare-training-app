import "dotenv/config";
import http from "http";
import { createApp } from "./app";
import { Database } from "./config/database"
import { Config } from "./config/config"
import { AppointmentModel } from "./models/appointment.model";
import { DoctorModel } from "./models/doctor.model";
import { UserModel } from "./models/user.model";
import { AuditLogModel } from "./models/auditLog.model";
import { SocketManager } from "./realtime/SocketManager";
import { tokenService } from "./container";
import { NotificationModel } from "./models/notification.model";

// const PORT =Number(process.env.PORT) || 5000;

async function bootstrap(): Promise<void> {
    const config = Config.getInstance();

    const database = Database.getInstance();

    const app = createApp();
    await database.connect();

    await Promise.all([UserModel.init(), DoctorModel.init(), AppointmentModel.init(), AuditLogModel.init(), NotificationModel.init()]);

    const server = http.createServer(app);

    const sockets = SocketManager.getInstance();
    sockets.init(server, tokenService);

    server.listen(config.port, () => {
        console.log(`HealthCare training backend is listening on PORT ${config.port} (${config.nodeEnv})`)
    });

    const shutDown = (signal: string): void => {
        console.log(`${signal} received. shutting down...`);
        sockets.disconnectAll();
        server.close(async () => {
            await database.disconnected();
            console.log("Http Server Cloesed");
            process.exit(0);
        });
        setTimeout(() => process.exit(1), 10_000).unref();
    }
    process.on("SIGINT", () => shutDown("SIGINT"));
    process.on("SIGTERM", () => shutDown("SIGTERM"));

}
bootstrap().catch((err) => {
    console.error("Failed to start Sever: ", err)
    process.exit(1);
})



