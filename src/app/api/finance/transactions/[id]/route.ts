import { FinancialTransactionStatus, FinancialTransactionType, Role } from "@prisma/client";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const updateSchema = z.object({
  type: z.nativeEnum(FinancialTransactionType).optional(),
  amount: z.number().positive().optional(),
  competenceDate: z.string().datetime().optional(),
  settlementDate: z.string().datetime().optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  accountId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  supplierId: z.string().min(1).optional(),
  propertyId: z.string().min(1).optional(),
  status: z.nativeEnum(FinancialTransactionStatus).optional(),
});

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    await requireDbUser();
    const { id } = await context.params;
    const transaction = await prisma.financialTransaction.findUnique({
      where: { id },
      include: {
        supplier: true,
        property: true,
        account: true,
        category: true,
      },
    });

    if (!transaction) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Transaction not found",
        status: 404,
      });
    }

    return transaction;
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const user = await requireDbUser([Role.ADMIN, Role.FINANCE]);
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

    const data = payload.data;
    const hasCriticalChange = [
      data.type,
      data.amount,
      data.competenceDate,
      data.accountId,
      data.categoryId,
      data.supplierId,
      data.propertyId,
    ].some((value) => value !== undefined);

    if (hasCriticalChange) {
      const postedEntry = await prisma.journalEntry.findFirst({
        where: {
          sourceType: "FINANCIAL",
          sourceId: id,
          status: "POSTED",
        },
      });

      if (postedEntry) {
        throw new AppError({
          code: "PRECONDITION_FAILED",
          message: "Lançamento já contabilizado. Estorne antes de alterar.",
          status: 412,
        });
      }
    }

    const changedFields = Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key);

    try {
      const updatedTransaction = await prisma.financialTransaction.update({
        where: { id },
        data: {
          type: data.type,
          amount: data.amount,
          competenceDate: data.competenceDate
            ? new Date(data.competenceDate)
            : undefined,
          settlementDate:
            data.settlementDate === null
              ? null
              : data.settlementDate
                ? new Date(data.settlementDate)
                : undefined,
          description: data.description ?? undefined,
          accountId: data.accountId,
          categoryId: data.categoryId,
          supplierId: data.supplierId,
          propertyId: data.propertyId,
          status: data.status,
        },
        include: {
          supplier: true,
          property: true,
          account: true,
          category: true,
        },
      });

      await writeAuditLog(prisma, {
        action: "FINANCIAL_TRANSACTION_UPDATED",
        entityType: "FinancialTransaction",
        entityId: updatedTransaction.id,
        actorUserId: user.id,
        metadata: {
          changedFields,
          status: updatedTransaction.status,
        },
      });

      return updatedTransaction;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "P2025"
      ) {
        throw new AppError({
          code: "NOT_FOUND",
          message: "Transaction not found",
          status: 404,
        });
      }
      throw error;
    }
  });
}
