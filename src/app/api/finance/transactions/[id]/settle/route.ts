import {
  AccountingIssueStatus,
  FinancialTransactionStatus,
  JournalEntrySourceType,
  JournalEntryStatus,
  Role,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const selectMappingRule = async (
  client: Prisma.TransactionClient,
  params: {
    financialCategoryId: string;
    financialAccountId: string;
    supplierId: string;
    propertyId: string | null;
  },
) => {
  const rules = await client.mappingRule.findMany({
    where: {
      financialCategoryId: params.financialCategoryId,
      financialAccountId: params.financialAccountId,
      OR: [
        { supplierId: params.supplierId, propertyId: params.propertyId },
        { supplierId: params.supplierId, propertyId: null },
        { supplierId: null, propertyId: params.propertyId },
        { supplierId: null, propertyId: null },
      ],
    },
    orderBy: [{ supplierId: "desc" }, { propertyId: "desc" }],
  });

  if (rules.length === 0) {
    return null;
  }

  const exact = rules.find(
    (rule) =>
      rule.supplierId === params.supplierId &&
      rule.propertyId === params.propertyId,
  );
  if (exact) {
    return exact;
  }

  const supplierOnly = rules.find(
    (rule) => rule.supplierId === params.supplierId && rule.propertyId === null,
  );
  if (supplierOnly) {
    return supplierOnly;
  }

  const propertyOnly = rules.find(
    (rule) => rule.supplierId === null && rule.propertyId === params.propertyId,
  );
  if (propertyOnly) {
    return propertyOnly;
  }

  return rules.find(
    (rule) => rule.supplierId === null && rule.propertyId === null,
  );
};

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

    return prisma.$transaction(async (tx) => {
      const updatedTransaction = await tx.financialTransaction.update({
        where: { id: transaction.id },
        data: {
          status: FinancialTransactionStatus.SETTLED,
          settlementDate: transaction.settlementDate ?? new Date(),
        },
      });

      await writeAuditLog(tx, {
        action: "FINANCIAL_TRANSACTION_SETTLED",
        entityType: "FinancialTransaction",
        entityId: updatedTransaction.id,
        actorUserId: user.id,
        metadata: {
          status: updatedTransaction.status,
          settlementDate: updatedTransaction.settlementDate,
        },
      });

      const existingEntry = await tx.journalEntry.findUnique({
        where: {
          sourceType_sourceId: {
            sourceType: JournalEntrySourceType.FINANCIAL,
            sourceId: transaction.id,
          },
        },
        include: { lines: true },
      });

      if (existingEntry) {
        return {
          transaction: updatedTransaction,
          journalEntry: existingEntry,
          issue: null,
        };
      }

      const mappingRule = await selectMappingRule(tx, {
        financialCategoryId: transaction.categoryId,
        financialAccountId: transaction.accountId,
        supplierId: transaction.supplierId,
        propertyId: transaction.propertyId,
      });

      if (!mappingRule) {
        const existingIssue = await tx.accountingIssue.findFirst({
          where: {
            financialTransactionId: transaction.id,
            status: AccountingIssueStatus.OPEN,
            reason: "MISSING_MAPPING",
          },
        });

        if (existingIssue) {
          return {
            transaction: updatedTransaction,
            journalEntry: null,
            issue: existingIssue,
          };
        }

        const issue = await tx.accountingIssue.create({
          data: {
            reason: "MISSING_MAPPING",
            details: {
              financialCategoryId: transaction.categoryId,
              financialAccountId: transaction.accountId,
              supplierId: transaction.supplierId,
              propertyId: transaction.propertyId,
            },
            financialTransactionId: transaction.id,
          },
        });

        await writeAuditLog(tx, {
          action: "ACCOUNTING_ISSUE_CREATED",
          entityType: "AccountingIssue",
          entityId: issue.id,
          actorUserId: user.id,
          metadata: {
            reason: issue.reason,
            financialTransactionId: issue.financialTransactionId,
          },
        });

        return {
          transaction: updatedTransaction,
          journalEntry: null,
          issue,
        };
      }

      try {
        const entry = await tx.journalEntry.create({
          data: {
            date: transaction.settlementDate ?? new Date(),
            description: transaction.description ?? null,
            status: JournalEntryStatus.POSTED,
            sourceType: JournalEntrySourceType.FINANCIAL,
            sourceId: transaction.id,
            createdById: user.id,
            lines: {
              create: [
                {
                  accountId: mappingRule.debitAccountId,
                  debit: transaction.amount,
                  credit: 0,
                  memo: transaction.description ?? null,
                },
                {
                  accountId: mappingRule.creditAccountId,
                  debit: 0,
                  credit: transaction.amount,
                  memo: transaction.description ?? null,
                },
              ],
            },
          },
          include: { lines: true },
        });

        await writeAuditLog(tx, {
          action: "JOURNAL_ENTRY_CREATED",
          entityType: "JournalEntry",
          entityId: entry.id,
          actorUserId: user.id,
          metadata: {
            sourceType: entry.sourceType,
            sourceId: entry.sourceId,
            lineCount: entry.lines.length,
          },
        });

        return {
          transaction: updatedTransaction,
          journalEntry: entry,
          issue: null,
        };
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "P2002"
        ) {
          const entry = await tx.journalEntry.findUnique({
            where: {
              sourceType_sourceId: {
                sourceType: JournalEntrySourceType.FINANCIAL,
                sourceId: transaction.id,
              },
            },
            include: { lines: true },
          });

          return {
            transaction: updatedTransaction,
            journalEntry: entry,
            issue: null,
          };
        }
        throw error;
      }
    });
  });
}
