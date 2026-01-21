import { AccountingIssueStatus, Role } from "@prisma/client";

import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const user = await requireDbUser([Role.ADMIN, Role.ACCOUNTING]);
    const { id } = await context.params;

    const issue = await prisma.accountingIssue.findUnique({
      where: { id },
    });

    if (!issue) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Accounting issue not found",
        status: 404,
      });
    }

    if (issue.status === AccountingIssueStatus.RESOLVED) {
      return issue;
    }

    const updatedIssue = await prisma.accountingIssue.update({
      where: { id },
      data: {
        status: AccountingIssueStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedById: user.id,
      },
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

    await writeAuditLog(prisma, {
      action: "ACCOUNTING_ISSUE_RESOLVED",
      entityType: "AccountingIssue",
      entityId: updatedIssue.id,
      actorUserId: user.id,
      metadata: {
        status: updatedIssue.status,
        financialTransactionId: updatedIssue.financialTransactionId,
      },
    });

    return updatedIssue;
  });
}
