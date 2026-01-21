import { Role } from "@prisma/client";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const updateSchema = z.object({
  financialCategoryId: z.string().min(1).optional(),
  financialAccountId: z.string().min(1).optional(),
  supplierId: z.string().min(1).nullable().optional(),
  propertyId: z.string().min(1).nullable().optional(),
  debitAccountId: z.string().min(1).optional(),
  creditAccountId: z.string().min(1).optional(),
});

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    await requireDbUser();
    const { id } = await context.params;
    const rule = await prisma.mappingRule.findUnique({
      where: { id },
      include: {
        financialCategory: true,
        financialAccount: true,
        supplier: true,
        property: true,
        debitAccount: true,
        creditAccount: true,
      },
    });

    if (!rule) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Mapping rule not found",
        status: 404,
      });
    }

    return rule;
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const user = await requireDbUser([Role.ADMIN, Role.ACCOUNTING]);
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

    const supplierId = payload.data.supplierId?.trim();
    const propertyId = payload.data.propertyId?.trim();

    const changedFields = Object.entries(payload.data)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key);

    try {
      const rule = await prisma.mappingRule.update({
        where: { id },
        data: {
          financialCategoryId: payload.data.financialCategoryId,
          financialAccountId: payload.data.financialAccountId,
          supplierId: supplierId ?? null,
          propertyId: propertyId ?? null,
          debitAccountId: payload.data.debitAccountId,
          creditAccountId: payload.data.creditAccountId,
        },
        include: {
          financialCategory: true,
          financialAccount: true,
          supplier: true,
          property: true,
          debitAccount: true,
          creditAccount: true,
        },
      });

      await writeAuditLog(prisma, {
        action: "MAPPING_RULE_UPDATED",
        entityType: "MappingRule",
        entityId: rule.id,
        actorUserId: user.id,
        metadata: {
          changedFields,
          financialCategoryId: rule.financialCategoryId,
          financialAccountId: rule.financialAccountId,
          supplierId: rule.supplierId,
          propertyId: rule.propertyId,
          debitAccountId: rule.debitAccountId,
          creditAccountId: rule.creditAccountId,
        },
      });

      return rule;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new AppError({
          code: "CONFLICT",
          message: "Mapping rule already exists",
          status: 409,
        });
      }
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "P2025"
      ) {
        throw new AppError({
          code: "NOT_FOUND",
          message: "Mapping rule not found",
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
    const user = await requireDbUser([Role.ADMIN, Role.ACCOUNTING]);
    const { id } = await context.params;
    try {
      const rule = await prisma.mappingRule.delete({
        where: { id },
      });

      await writeAuditLog(prisma, {
        action: "MAPPING_RULE_DELETED",
        entityType: "MappingRule",
        entityId: rule.id,
        actorUserId: user.id,
        metadata: {
          financialCategoryId: rule.financialCategoryId,
          financialAccountId: rule.financialAccountId,
          supplierId: rule.supplierId,
          propertyId: rule.propertyId,
          debitAccountId: rule.debitAccountId,
          creditAccountId: rule.creditAccountId,
        },
      });

      return rule;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "P2025"
      ) {
        throw new AppError({
          code: "NOT_FOUND",
          message: "Mapping rule not found",
          status: 404,
        });
      }
      throw error;
    }
  });
}
