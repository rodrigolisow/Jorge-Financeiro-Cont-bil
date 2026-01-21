import { AccountingIssueStatus, Role } from "@prisma/client";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const listSchema = z.object({
  status: z.nativeEnum(AccountingIssueStatus).optional(),
});

const createSchema = z.object({
  reason: z.string().trim().min(1),
  details: z.record(z.any()).optional(),
  financialTransactionId: z.string().min(1),
});

export async function GET(request: Request) {
  return handleRoute(async () => {
    await requireDbUser();
    const { searchParams } = new URL(request.url);
    const payload = listSchema.safeParse({
      status: searchParams.get("status") ?? undefined,
    });

    if (!payload.success) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Invalid filters",
        status: 400,
        details: payload.error.flatten(),
      });
    }

    return prisma.accountingIssue.findMany({
      where: {
        status: payload.data.status,
      },
      orderBy: { createdAt: "desc" },
      include: {
        financialTransaction: {
          include: {
            supplier: true,
            property: true,
            account: true,
            category: true,
          },
        },
        resolvedBy: true,
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

    const issue = await prisma.accountingIssue.create({
      data: {
        reason: payload.data.reason.trim(),
        details: payload.data.details ?? undefined,
        financialTransactionId: payload.data.financialTransactionId,
      },
      include: {
        financialTransaction: true,
      },
    });

    await writeAuditLog(prisma, {
      action: "ACCOUNTING_ISSUE_CREATED",
      entityType: "AccountingIssue",
      entityId: issue.id,
      actorUserId: user.id,
      metadata: {
        reason: issue.reason,
        financialTransactionId: issue.financialTransactionId,
      },
    });

    return issue;
  });
}
