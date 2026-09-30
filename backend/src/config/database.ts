import mongoose from "mongoose";
import { Config } from "./config";

export class Database {
    private static instance: Database;
    private connected = false;

    private constructor() { }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }


    public async connect(): Promise<void> {
        if (this.connected) return;

        const { mongoUri } = Config.getInstance();

        mongoose.connection.on("disconnected", () => {
            this.connected = false;
            console.log("MongoDB disconnected")
        });

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
        })
        this.connected = true;
        console.log("MongoDb Connected");

    }


    public async disconnected(): Promise<void> {
        if (!this.connected) return;
        await mongoose.disconnect();
        this.connected = false;
        console.log("MongoDB disconnected cleanly")
    }

    public isConnected(): boolean {
        return this.connected;
    }

}