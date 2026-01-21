import { ChartOfAccountType, Role } from "@prisma/client";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";

const createSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: z.nativeEnum(ChartOfAccountType),
  parentId: z.string().trim().min(1).optional().nullable(),
});

export async function GET() {
  return handleRoute(async () => {
    await requireDbUser();
    return prisma.chartOfAccount.findMany({
      orderBy: [{ code: "asc" }],
      include: {
        parent: true,
      },
    });
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    await requireDbUser([Role.ADMIN, Role.ACCOUNTING]);
    const payload = createSchema.safeParse(await request.json());

    if (!payload.success) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Invalid payload",
        status: 400,
        details: payload.error.flatten(),
      });
    }

    const parentId = payload.data.parentId?.trim();

    return prisma.chartOfAccount.create({
      data: {
        code: payload.data.code.trim(),
        name: payload.data.name.trim(),
        type: payload.data.type,
        parentId: parentId || null,
      },
    });
  });
}
