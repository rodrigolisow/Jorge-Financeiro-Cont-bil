import { ChartOfAccountType, Role } from "@prisma/client";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";

const updateSchema = z.object({
  code: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  type: z.nativeEnum(ChartOfAccountType).optional(),
  parentId: z.string().trim().min(1).nullable().optional(),
});

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    await requireDbUser();
    const { id } = await context.params;
    const account = await prisma.chartOfAccount.findUnique({
      where: { id },
      include: { parent: true },
    });

    if (!account) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Chart account not found",
        status: 404,
      });
    }

    return account;
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    await requireDbUser([Role.ADMIN, Role.ACCOUNTING]);
    const { id } = await context.params;
    const payload = updateSchema.safeParse(await request.json());

    if (!payload.success) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Invalid payload",
        status: 400,
        details: payload.error.flatten(),
      });
    }

    const parentId = payload.data.parentId?.trim();

    try {
      return await prisma.chartOfAccount.update({
        where: { id },
        data: {
          code: payload.data.code?.trim(),
          name: payload.data.name?.trim(),
          type: payload.data.type,
          parentId: parentId ?? null,
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "P2025"
      ) {
        throw new AppError({
          code: "NOT_FOUND",
          message: "Chart account not found",
          status: 404,
        });
      }
      throw error;
    }
  });
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    await requireDbUser([Role.ADMIN, Role.ACCOUNTING]);
    const { id } = await context.params;
    try {
      return await prisma.chartOfAccount.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "P2025"
      ) {
        throw new AppError({
          code: "NOT_FOUND",
          message: "Chart account not found",
          status: 404,
        });
      }
      throw error;
    }
  });
}
