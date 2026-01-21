import { FinancialTransactionStatus, FinancialTransactionType, Prisma, Role } from "@prisma/client";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const listSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  supplierId: z.string().optional(),
  propertyId: z.string().optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  status: z.nativeEnum(FinancialTransactionStatus).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

const createSchema = z.object({
  type: z.nativeEnum(FinancialTransactionType),
  amount: z.number().positive(),
  competenceDate: z.string().datetime(),
  settlementDate: z.string().datetime().optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  accountId: z.string().min(1),
  categoryId: z.string().min(1),
  supplierId: z.string().min(1),
  propertyId: z.string().min(1),
});

export async function GET(request: Request) {
  return handleRoute(async () => {
    await requireDbUser();
    const { searchParams } = new URL(request.url);
    const payload = listSchema.safeParse({
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      supplierId: searchParams.get("supplierId") ?? undefined,
      propertyId: searchParams.get("propertyId") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      accountId: searchParams.get("accountId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    if (!payload.success) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Invalid filters",
        status: 400,
        details: payload.error.flatten(),
      });
    }

    const {
      startDate,
      endDate,
      supplierId,
      propertyId,
      categoryId,
      accountId,
      status,
      page,
      pageSize,
    } = payload.data;

    const take = Math.min(pageSize ?? 20, 100);
    const currentPage = page ?? 1;
    const skip = (currentPage - 1) * take;

    const where = {
      competenceDate: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
      supplierId,
      propertyId,
      categoryId,
      accountId,
      status,
    };

    const [items, totalCount, totalAggregate, incomeAggregate, expenseAggregate] =
      await prisma.$transaction([
        prisma.financialTransaction.findMany({
          where,
          orderBy: { competenceDate: "desc" },
          include: {
            supplier: true,
            property: true,
            account: true,
            category: true,
          },
          skip,
          take,
        }),
        prisma.financialTransaction.count({ where }),
        prisma.financialTransaction.aggregate({
          where,
          _sum: { amount: true },
        }),
        prisma.financialTransaction.aggregate({
          where: { ...where, type: FinancialTransactionType.INCOME },
          _sum: { amount: true },
        }),
        prisma.financialTransaction.aggregate({
          where: { ...where, type: FinancialTransactionType.EXPENSE },
          _sum: { amount: true },
        }),
      ]);

    const totals = {
      total: (totalAggregate._sum.amount ?? new Prisma.Decimal(0)).toString(),
      income: (incomeAggregate._sum.amount ?? new Prisma.Decimal(0)).toString(),
      expense: (expenseAggregate._sum.amount ?? new Prisma.Decimal(0)).toString(),
    };

    return {
      items,
      page: currentPage,
      pageSize: take,
      totalCount,
      totals,
    };
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireDbUser([Role.ADMIN, Role.FINANCE]);
    const payload = createSchema.safeParse(await request.json());

    if (!payload.success) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Invalid payload",
        status: 400,
        details: payload.error.flatten(),
      });
    }

    const data = payload.data;

    const transaction = await prisma.financialTransaction.create({
      data: {
        type: data.type,
        status: FinancialTransactionStatus.PLANNED,
        amount: data.amount,
        competenceDate: new Date(data.competenceDate),
        settlementDate: data.settlementDate ? new Date(data.settlementDate) : null,
        description: data.description ?? null,
        accountId: data.accountId,
        categoryId: data.categoryId,
        supplierId: data.supplierId,
        propertyId: data.propertyId,
        createdById: user.id,
      },
      include: {
        supplier: true,
        property: true,
        account: true,
        category: true,
      },
    });

    await writeAuditLog(prisma, {
      action: "FINANCIAL_TRANSACTION_CREATED",
      entityType: "FinancialTransaction",
      entityId: transaction.id,
      actorUserId: user.id,
      metadata: {
        status: transaction.status,
        type: transaction.type,
        amount: transaction.amount,
        accountId: transaction.accountId,
        categoryId: transaction.categoryId,
        supplierId: transaction.supplierId,
        propertyId: transaction.propertyId,
      },
    });

    return transaction;
  });
}
