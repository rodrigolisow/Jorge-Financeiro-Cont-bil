import { Role } from "@prisma/client";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  document: z.string().trim().min(1).nullable().optional(),
});

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    await requireDbUser();
    const { id } = await context.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Supplier not found",
        status: 404,
      });
    }

    return supplier;
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

    const document = payload.data.document?.trim();

    try {
      return await prisma.supplier.update({
        where: { id },
        data: {
          name: payload.data.name?.trim(),
          document: document ?? null,
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
          message: "Supplier not found",
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
      return await prisma.supplier.delete({
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
          message: "Supplier not found",
          status: 404,
        });
      }
      throw error;
    }
  });
}
