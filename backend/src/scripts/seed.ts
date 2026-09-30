import argon2 from "argon2";
import { Database } from "../config/database";
import { UserModel } from "../models/user.model";
import { MongoUserRepository } from "../repositories/mongodb/MongoUserRepository";
import type { CreateUserInput } from "../types/user";

const DEMO_PASSWORD = "Demo@12345"; // demo only

const demoUsers: Array<Omit<CreateUserInput, "passwordHash">> = [
  { email: "admin@demo.test", firstName: "Ada", lastName: "Admin", role: "ADMIN" },
  { email: "doctor@demo.test", firstName: "Dev", lastName: "Doctor", role: "DOCTOR" },
  { email: "reception@demo.test", firstName: "Riya", lastName: "Reception", role: "RECEPTIONIST" },
  { email: "patient@demo.test", firstName: "Pat", lastName: "Patient", role: "PATIENT" },
  { email: "patient2@demo.test", firstName: "Sam", lastName: "Second", role: "PATIENT" },
];

async function seed(): Promise<void> {
  const database = Database.getInstance();
  await database.connect();
  await UserModel.init(); // make sure the unique email index exists

  const repo = new MongoUserRepository();
  const passwordHash = await argon2.hash(DEMO_PASSWORD);

  for (const user of demoUsers) {
    if (await repo.findByEmail(user.email)) {
      console.log(`skipped (exists): ${user.email}`);
      continue;
    }
    await repo.create({ ...user, passwordHash });
    console.log(`created: ${user.email} [${user.role}]`);
  }

  await database.disconnected(); // your renamed method
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});