import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import fs from "fs";
import dotenv from "dotenv";

if (fs.existsSync(".env")) {
  dotenv.config({ path: ".env" });
} else {
  dotenv.config({ path: ".env.example" });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
