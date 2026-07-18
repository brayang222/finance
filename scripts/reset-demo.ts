import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
bcrypt.hash("demo1234", 12).then(async (hash) => {
  await db.user.update({ where: { email: "demo@test.com" }, data: { password: hash } });
  console.log("Password reset to: demo1234");
  await db.$disconnect();
});
