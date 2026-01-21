/**
 * Finance Domain - Use Cases
 *
 * Centralized business logic for financial operations.
 * Route handlers should delegate to these functions.
 */

import { FinancialTransactionStatus, FinancialTransactionType, JournalEntrySourceType, Role, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";

// ============================================================================
// Types
// ============================================================================

export type CreateTransactionInput = {
    type: FinancialTransactionType;
    amount: number;
    competenceDate: Date;
    settlementDate?: Date | null;
    description?: string | null;
    accountId: string;
    categoryId: string;
    supplierId: string;
    propertyId?: string | null;
};

export type UpdateTransactionInput = Partial<CreateTransactionInput> & {
    status?: FinancialTransactionStatus;
};

export type SettleTransactionResult = {
    transaction: {
        id: string;
        status: FinancialTransactionStatus;
        settlementDate: Date | null;
    };
    journalEntry?: { id: string } | null;
    issue?: { id: string; reason: string } | null;
};

// ============================================================================
// Use Cases
// ============================================================================

/**
 * Create a new financial transaction.
 */
export async function createTransaction(input: CreateTransactionInput, userId: string) {
    const transaction = await prisma.financialTransaction.create({
        data: {
            type: input.type,
            status: FinancialTransactionStatus.PLANNED,
            amount: input.amount,
            competenceDate: input.competenceDate,
            settlementDate: input.settlementDate ?? null,
            description: input.description ?? null,
            accountId: input.accountId,
            categoryId: input.categoryId,
            supplierId: input.supplierId,
            propertyId: input.propertyId ?? undefined,
            createdById: userId,
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
        actorUserId: userId,
        metadata: {
            status: transaction.status,
            type: transaction.type,
            amount: String(transaction.amount),
        },
    });

    return transaction;
}

/**
 * Settle a financial transaction and generate accounting entry if mapping exists.
 */
export async function settleTransaction(
    transactionId: string,
    userId: string
): Promise<SettleTransactionResult> {
    return prisma.$transaction(async (tx) => {
        // 1. Load transaction
        const transaction = await tx.financialTransaction.findUnique({
            where: { id: transactionId },
            include: { category: true, account: true },
        });

        if (!transaction) {
            throw new AppError({
                code: "NOT_FOUND",
                message: "Transaction not found",
                status: 404,
            });
        }

        if (transaction.status === FinancialTransactionStatus.SETTLED) {
            throw new AppError({
                code: "CONFLICT",
                message: "Transaction already settled",
                status: 409,
            });
        }

        if (transaction.status === FinancialTransactionStatus.CANCELED) {
            throw new AppError({
                code: "PRECONDITION_FAILED",
                message: "Cannot settle canceled transaction",
                status: 412,
            });
        }

        // 2. Update to SETTLED
        const updated = await tx.financialTransaction.update({
            where: { id: transactionId },
            data: {
                status: FinancialTransactionStatus.SETTLED,
                settlementDate: transaction.settlementDate ?? new Date(),
            },
        });

        // 3. Try to find mapping rule
        const mappingRule = await tx.mappingRule.findFirst({
            where: {
                financialCategoryId: transaction.categoryId,
                financialAccountId: transaction.accountId,
            },
        });

        let journalEntry = null;
        let issue = null;

        if (mappingRule) {
            // 4a. Generate journal entry (idempotent via unique constraint)
            const existingEntry = await tx.journalEntry.findUnique({
                where: {
                    sourceType_sourceId: {
                        sourceType: JournalEntrySourceType.FINANCIAL,
                        sourceId: transactionId,
                    },
                },
            });

            if (!existingEntry) {
                journalEntry = await tx.journalEntry.create({
                    data: {
                        date: updated.settlementDate ?? new Date(),
                        description: transaction.description ?? `Lançamento financeiro ${transactionId}`,
                        status: "POSTED",
                        sourceType: JournalEntrySourceType.FINANCIAL,
                        sourceId: transactionId,
                        createdById: userId,
                        lines: {
                            create: [
                                {
                                    accountId: mappingRule.debitAccountId,
                                    debit: transaction.amount,
                                    credit: new Prisma.Decimal(0),
                                    memo: null,
                                },
                                {
                                    accountId: mappingRule.creditAccountId,
                                    debit: new Prisma.Decimal(0),
                                    credit: transaction.amount,
                                    memo: null,
                                },
                            ],
                        },
                    },
                });
            } else {
                journalEntry = existingEntry;
            }
        } else {
            // 4b. Create accounting issue (missing mapping)
            issue = await tx.accountingIssue.create({
                data: {
                    status: "OPEN",
                    reason: "MISSING_MAPPING",
                    details: {
                        categoryId: transaction.categoryId,
                        accountId: transaction.accountId,
                        transactionType: transaction.type,
                    },
                    financialTransactionId: transactionId,
                },
            });
        }

        // 5. Audit log
        await writeAuditLog(tx, {
            action: "FINANCIAL_TRANSACTION_SETTLED",
            entityType: "FinancialTransaction",
            entityId: transactionId,
            actorUserId: userId,
            metadata: {
                previousStatus: transaction.status,
                newStatus: updated.status,
                journalEntryId: journalEntry?.id ?? null,
                issueId: issue?.id ?? null,
            },
        });

        return {
            transaction: {
                id: updated.id,
                status: updated.status,
                settlementDate: updated.settlementDate,
            },
            journalEntry: journalEntry ? { id: journalEntry.id } : null,
            issue: issue ? { id: issue.id, reason: issue.reason } : null,
        };
    });
}

/**
 * Cancel a financial transaction.
 */
export async function cancelTransaction(transactionId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
        const transaction = await tx.financialTransaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction) {
            throw new AppError({
                code: "NOT_FOUND",
                message: "Transaction not found",
                status: 404,
            });
        }

        if (transaction.status === FinancialTransactionStatus.CANCELED) {
            throw new AppError({
                code: "CONFLICT",
                message: "Transaction already canceled",
                status: 409,
            });
        }

        // Check if there's a posted journal entry
        const journalEntry = await tx.journalEntry.findUnique({
            where: {
                sourceType_sourceId: {
                    sourceType: JournalEntrySourceType.FINANCIAL,
                    sourceId: transactionId,
                },
            },
        });

        if (journalEntry && journalEntry.status === "POSTED") {
            throw new AppError({
                code: "PRECONDITION_FAILED",
                message: "Cannot cancel: journal entry already posted. Reverse the journal entry first.",
                status: 412,
            });
        }

        const updated = await tx.financialTransaction.update({
            where: { id: transactionId },
            data: { status: FinancialTransactionStatus.CANCELED },
        });

        await writeAuditLog(tx, {
            action: "FINANCIAL_TRANSACTION_CANCELED",
            entityType: "FinancialTransaction",
            entityId: transactionId,
            actorUserId: userId,
            metadata: {
                previousStatus: transaction.status,
                newStatus: updated.status,
            },
        });

        return updated;
    });
}
