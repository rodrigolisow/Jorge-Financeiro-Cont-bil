import { FinancialAccountType, Role } from "@prisma/client";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/http";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  type: z.nativeEnum(FinancialAccountType).optional(),
});

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    await requireDbUser();
    const { id } = await context.params;
    const account = await prisma.financialAccount.findUnique({
      where: { id },
    });

    if (!account) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Account not found",
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
    await requireDbUser([Role.ADMIN, Role.FINANCE]);
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

    try {
      return await prisma.financialAccount.update({
        where: { id },
        data: {
          name: payload.data.name?.trim(),
          type: payload.data.type,
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
          message: "Account not found",
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
    await requireDbUser([Role.ADMIN, Role.FINANCE]);
    const { id } = await context.params;
    try {
      return await prisma.financialAccount.delete({
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
          message: "Account not found",
          status: 404,
        });
      }
      throw error;
    }
  });
}
