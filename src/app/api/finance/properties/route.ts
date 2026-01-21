import { Role } from "@prisma/client";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/http";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().trim().min(1),
  code: z.string().trim().min(1).optional().nullable(),
});

export async function GET() {
  return handleRoute(async () => {
    await requireDbUser();
    return prisma.property.findMany({ orderBy: { name: "asc" } });
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

    const code = payload.data.code?.trim();

    return prisma.property.create({
      data: {
        name: payload.data.name.trim(),
        code: code || null,
      },
    });
  });
}
