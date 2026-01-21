import { FinancialTransactionStatus, JournalEntryStatus, Role } from "@prisma/client";

import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { reverseJournalEntry } from "@/lib/journal";

export async function POST(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const user = await requireDbUser([Role.ADMIN, Role.FINANCE]);
    const { id } = await context.params;

    const transaction = await prisma.financialTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Transaction not found",
        status: 404,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.findUnique({
        where: {
          sourceType_sourceId: {
            sourceType: "FINANCIAL",
            sourceId: id,
          },
        },
        include: { lines: true },
      });

      if (entry && entry.status === JournalEntryStatus.POSTED) {
        const reversal = await reverseJournalEntry(tx, entry, user.id);
        if (reversal) {
          await writeAuditLog(tx, {
            action: "JOURNAL_ENTRY_REVERSED",
            entityType: "JournalEntry",
            entityId: entry.id,
            actorUserId: user.id,
            metadata: {
              sourceType: entry.sourceType,
              sourceId: entry.sourceId,
            },
          });

          await writeAuditLog(tx, {
            action: "JOURNAL_ENTRY_CREATED",
            entityType: "JournalEntry",
            entityId: reversal.reversalEntry.id,
            actorUserId: user.id,
            metadata: {
              reversalOf: entry.id,
            },
          });
        }
      }

      const updatedTransaction = await tx.financialTransaction.update({
        where: { id },
        data: {
          status: FinancialTransactionStatus.CANCELED,
        },
      });

      await writeAuditLog(tx, {
        action: "FINANCIAL_TRANSACTION_CANCELED",
        entityType: "FinancialTransaction",
        entityId: updatedTransaction.id,
        actorUserId: user.id,
        metadata: {
          status: updatedTransaction.status,
        },
      });

      return updatedTransaction;
    });

    return result;
  });
}
