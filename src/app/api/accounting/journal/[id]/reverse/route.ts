import { Role } from "@prisma/client";

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
    const user = await requireDbUser([Role.ADMIN, Role.ACCOUNTING]);
    const { id } = await context.params;

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!entry) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Journal entry not found",
        status: 404,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const reversal = await reverseJournalEntry(tx, entry, user.id);

      if (!reversal) {
        return { reversedEntry: entry, reversalEntry: null };
      }

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

      return reversal;
    });

    return result;
  });
}
