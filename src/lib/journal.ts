import { JournalEntrySourceType, JournalEntryStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

type JournalEntryLineInput = {
  accountId: string;
  debit: Prisma.Decimal;
  credit: Prisma.Decimal;
  memo: string | null;
};

type JournalEntryInput = {
  id: string;
  status: JournalEntryStatus;
  lines: JournalEntryLineInput[];
};

type ReverseResult = {
  reversedEntry: { id: string; status: JournalEntryStatus };
  reversalEntry: { id: string };
};

export async function reverseJournalEntry(
  client: Prisma.TransactionClient,
  entry: JournalEntryInput,
  userId: string,
) {
  if (entry.status === JournalEntryStatus.REVERSED) {
    return null;
  }

  const reversalEntry = await client.journalEntry.create({
    data: {
      date: new Date(),
      description: `Estorno de ${entry.id}`,
      status: JournalEntryStatus.POSTED,
      sourceType: JournalEntrySourceType.MANUAL,
      sourceId: null,
      createdById: userId,
      lines: {
        create: entry.lines.map((line) => ({
          accountId: line.accountId,
          debit: line.credit,
          credit: line.debit,
          memo: line.memo,
        })),
      },
    },
  });

  const reversedEntry = await client.journalEntry.update({
    where: { id: entry.id },
    data: { status: JournalEntryStatus.REVERSED },
  });

  const result: ReverseResult = {
    reversedEntry: { id: reversedEntry.id, status: reversedEntry.status },
    reversalEntry: { id: reversalEntry.id },
  };

  return result;
}
