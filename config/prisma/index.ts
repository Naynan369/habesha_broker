import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
	prisma = new PrismaClient();
} else {
	if (!global.prisma) {
		global.prisma = new PrismaClient();
	}
	prisma = global.prisma;
}

// Prisma connects on first use. Avoid an unhandled background connection error
// taking down the UI when the configured database is temporarily unreachable.
export { prisma };
