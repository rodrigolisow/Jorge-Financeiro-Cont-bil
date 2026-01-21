import { Role } from "@prisma/client";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const createSchema = z.object({
  financialCategoryId: z.string().min(1),
  financialAccountId: z.string().min(1),
  supplierId: z.string().min(1).optional().nullable(),
  propertyId: z.string().min(1).optional().nullable(),
  debitAccountId: z.string().min(1),
  creditAccountId: z.string().min(1),
});

export async function GET() {
  return handleRoute(async () => {
    await requireDbUser();
    return prisma.mappingRule.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        financialCategory: true,
        financialAccount: true,
        supplier: true,
        property: true,
        debitAccount: true,
        creditAccount: true,
      },
    });
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireDbUser([Role.ADMIN, Role.ACCOUNTING]);
    const payload = createSchema.safeParse(await request.json());

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

    try {
      const rule = await prisma.mappingRule.create({
        data: {
          financialCategoryId: payload.data.financialCategoryId,
          financialAccountId: payload.data.financialAccountId,
          supplierId: supplierId || null,
          propertyId: propertyId || null,
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
        action: "MAPPING_RULE_CREATED",
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
        error.code === "P2002"
      ) {
        throw new AppError({
          code: "CONFLICT",
          message: "Mapping rule already exists",
          status: 409,
        });
      }
      throw error;
    }
  });
}
