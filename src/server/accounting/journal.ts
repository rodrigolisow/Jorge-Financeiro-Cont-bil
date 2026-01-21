/**
 * Accounting Domain - Use Cases
 *
 * Centralized business logic for accounting operations.
 */

import { JournalEntrySourceType, JournalEntryStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { reverseJournalEntry } from "@/lib/journal";

// ============================================================================
// Types
// ============================================================================

export type CreateJournalEntryInput = {
    date: Date;
    description?: string | null;
    lines: Array<{
        accountId: string;
        debit: number;
        credit: number;
        memo?: string | null;
    }>;
};

// ============================================================================
// Use Cases
// ============================================================================

/**
 * Create a manual journal entry.
 */
export async function createManualJournalEntry(input: CreateJournalEntryInput, userId: string) {
    // Validate debits = credits
    const totalDebit = input.lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = input.lines.reduce((sum, l) => sum + l.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
        throw new AppError({
            code: "VALIDATION_ERROR",
            message: "Débitos devem ser iguais aos créditos",
            status: 400,
            details: { totalDebit, totalCredit },
        });
    }

    if (input.lines.length < 2) {
        throw new AppError({
            code: "VALIDATION_ERROR",
            message: "É necessário pelo menos 2 linhas (partida dobrada)",
            status: 400,
        });
    }

    const entry = await prisma.journalEntry.create({
        data: {
            date: input.date,
            description: input.description ?? null,
            status: JournalEntryStatus.POSTED,
            sourceType: JournalEntrySourceType.MANUAL,
            sourceId: null,
            createdById: userId,
            lines: {
                create: input.lines.map((line) => ({
                    accountId: line.accountId,
                    debit: new Prisma.Decimal(line.debit),
                    credit: new Prisma.Decimal(line.credit),
                    memo: line.memo ?? null,
                })),
            },
        },
        include: {
            lines: {
                include: { account: true },
            },
        },
    });

    await writeAuditLog(prisma, {
        action: "JOURNAL_ENTRY_CREATED",
        entityType: "JournalEntry",
        entityId: entry.id,
        actorUserId: userId,
        metadata: {
            sourceType: entry.sourceType,
            linesCount: entry.lines.length,
            totalDebit: String(totalDebit),
        },
    });

    return entry;
}

/**
 * Reverse a journal entry.
 */
export async function reverseEntry(entryId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
        const entry = await tx.journalEntry.findUnique({
            where: { id: entryId },
            include: { lines: true },
        });

        if (!entry) {
            throw new AppError({
                code: "NOT_FOUND",
                message: "Journal entry not found",
                status: 404,
            });
        }

        if (entry.status === JournalEntryStatus.REVERSED) {
            throw new AppError({
                code: "CONFLICT",
                message: "Entry already reversed",
                status: 409,
            });
        }

        const result = await reverseJournalEntry(tx, {
            id: entry.id,
            status: entry.status,
            lines: entry.lines.map((l) => ({
                accountId: l.accountId,
                debit: l.debit,
                credit: l.credit,
                memo: l.memo,
            })),
        }, userId);

        if (result) {
            await writeAuditLog(tx, {
                action: "JOURNAL_ENTRY_REVERSED",
                entityType: "JournalEntry",
                entityId: entryId,
                actorUserId: userId,
                metadata: {
                    reversalEntryId: result.reversalEntry.id,
                },
            });
        }

        return result;
    });
}

/**
 * Resolve an accounting issue.
 */
export async function resolveAccountingIssue(issueId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
        const issue = await tx.accountingIssue.findUnique({
            where: { id: issueId },
        });

        if (!issue) {
            throw new AppError({
                code: "NOT_FOUND",
                message: "Issue not found",
                status: 404,
            });
        }

        if (issue.status !== "OPEN") {
            throw new AppError({
                code: "CONFLICT",
                message: "Issue already resolved or ignored",
                status: 409,
            });
        }

        const updated = await tx.accountingIssue.update({
            where: { id: issueId },
            data: {
                status: "RESOLVED",
                resolvedAt: new Date(),
                resolvedById: userId,
            },
        });

        await writeAuditLog(tx, {
            action: "ACCOUNTING_ISSUE_RESOLVED",
            entityType: "AccountingIssue",
            entityId: issueId,
            actorUserId: userId,
            metadata: {
                reason: issue.reason,
                financialTransactionId: issue.financialTransactionId,
            },
        });

        return updated;
    });
}
