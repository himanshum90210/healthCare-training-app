import "dotenv/config";
import http from "http";
import { createApp } from "./app";
import { Database } from "./config/database"
import { Config } from "./config/config"

// const PORT =Number(process.env.PORT) || 5000;

async function bootstrap(): Promise<void> {
    const config = Config.getInstance();

    const database = Database.getInstance();

    const app = createApp();
    await database.connect()

    const server = http.createServer(app);

    server.listen(config.port, () => {
        console.log(`HealthCare training backend is listening on PORT ${config.port} (${config.nodeEnv})`)
    });

    const shutDown = (signal: string): void=> {
        console.log(`${signal} received. shutting down...`);
        server.close(async() => {
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



