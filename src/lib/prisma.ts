import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure Prisma with logging in development
// Connection pool is managed via DATABASE_URL params (e.g., ?connection_limit=5&pool_timeout=30)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handler
async function gracefulShutdown() {
  await prisma.$disconnect();
}

// Handle process termination
if (typeof process !== "undefined") {
  process.on("beforeExit", gracefulShutdown);
}
