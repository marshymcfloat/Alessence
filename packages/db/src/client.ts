// packages/db/src/client.ts

import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// This prevents us from creating a new PrismaClient instance on every hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

// Function to create an extended client
const createPrismaClient = () =>
  new PrismaClient({
    // Optional: Add logging for development
    // log: ["query", "info", "warn", "error"],
  }).$extends(withAccelerate());

// Use the cached instance in development, or create a new one
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache the instance in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
