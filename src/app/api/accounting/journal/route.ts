import { JournalEntrySourceType, JournalEntryStatus, Role } from "@prisma/client";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const listSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  accountId: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

const lineSchema = z.object({
  accountId: z.string().min(1),
  debit: z.number().nonnegative(),
  credit: z.number().nonnegative(),
  memo: z.string().trim().max(500).optional().nullable(),
});

const createSchema = z.object({
  date: z.string().datetime(),
  description: z.string().trim().max(500).optional().nullable(),
  lines: z.array(lineSchema).min(2),
});

const validateLines = (lines: z.infer<typeof lineSchema>[]) => {
  let debitTotal = 0;
  let creditTotal = 0;

  for (const line of lines) {
    const debit = Number(line.debit);
    const credit = Number(line.credit);
    const hasDebit = debit > 0;
    const hasCredit = credit > 0;

    if (hasDebit === hasCredit) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Each line must have either debit or credit",
        status: 400,
      });
    }

    debitTotal += debit;
    creditTotal += credit;
  }

  if (debitTotal <= 0 || creditTotal <= 0 || debitTotal !== creditTotal) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "Debits and credits must balance",
      status: 400,
      details: { debitTotal, creditTotal },
    });
  }
};

export async function GET(request: Request) {
  return handleRoute(async () => {
    await requireDbUser();
    const { searchParams } = new URL(request.url);
    const payload = listSchema.safeParse({
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      accountId: searchParams.get("accountId") ?? undefined,
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

    const { startDate, endDate, accountId, page, pageSize } = payload.data;

    const take = Math.min(pageSize ?? 20, 100);
    const currentPage = page ?? 1;
    const skip = (currentPage - 1) * take;

    const where = {
      sourceType: JournalEntrySourceType.MANUAL,
      date: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
      lines: accountId
        ? {
            some: { accountId },
          }
        : undefined,
    };

    const [items, totalCount] = await prisma.$transaction([
      prisma.journalEntry.findMany({
        where,
        orderBy: { date: "desc" },
        include: {
          lines: { include: { account: true } },
        },
        skip,
        take,
      }),
      prisma.journalEntry.count({ where }),
    ]);

    return {
      items,
      page: currentPage,
      pageSize: take,
      totalCount,
    };
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

    validateLines(payload.data.lines);

    const entry = await prisma.journalEntry.create({
      data: {
        date: new Date(payload.data.date),
        description: payload.data.description ?? null,
        status: JournalEntryStatus.POSTED,
        sourceType: JournalEntrySourceType.MANUAL,
        createdById: user.id,
        lines: {
          create: payload.data.lines.map((line) => ({
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            memo: line.memo ?? null,
          })),
        },
      },
      include: {
        lines: { include: { account: true } },
      },
    });

    const total = payload.data.lines.reduce(
      (sum, line) => sum + Number(line.debit || 0),
      0,
    );

    await writeAuditLog(prisma, {
      action: "JOURNAL_ENTRY_CREATED",
      entityType: "JournalEntry",
      entityId: entry.id,
      actorUserId: user.id,
      metadata: {
        sourceType: entry.sourceType,
        sourceId: entry.sourceId,
        lineCount: entry.lines.length,
        total,
      },
    });

    return entry;
  });
}
