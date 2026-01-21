import { z } from "zod";

import { Role } from "@prisma/client";

import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/http";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().trim().min(1),
  document: z.string().trim().min(1).optional().nullable(),
});

export async function GET() {
  return handleRoute(async () => {
    await requireDbUser();
    return prisma.supplier.findMany({ orderBy: { name: "asc" } });
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    await requireDbUser([Role.ADMIN, Role.FINANCE]);
    const payload = createSchema.safeParse(await request.json());

    if (!payload.success) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Invalid payload",
        status: 400,
        details: payload.error.flatten(),
      });
    }

    const document = payload.data.document?.trim();

    return prisma.supplier.create({
      data: {
        name: payload.data.name.trim(),
        document: document || null,
      },
    });
  });
}
