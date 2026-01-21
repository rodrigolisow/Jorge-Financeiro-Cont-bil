import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/lib/errors";
import { POST } from "@/app/api/finance/transactions/[id]/settle/route";
import { requireDbUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const mockPrisma = vi.hoisted(() => ({
  financialTransaction: {},
  journalEntry: {},
  mappingRule: {},
  accountingIssue: {},
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  requireDbUser: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  writeAuditLog: vi.fn(),
}));

describe("settleFinancialTransaction", () => {
  beforeEach(() => {
    const tx = {
      financialTransaction: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      journalEntry: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      mappingRule: {
        findMany: vi.fn(),
      },
      accountingIssue: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    };

    mockPrisma.financialTransaction = tx.financialTransaction;
    mockPrisma.journalEntry = tx.journalEntry;
    mockPrisma.mappingRule = tx.mappingRule;
    mockPrisma.accountingIssue = tx.accountingIssue;
    mockPrisma.$transaction = vi.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    );

    vi.mocked(requireDbUser).mockResolvedValue({
      id: "user-1",
      role: "FINANCE",
      clerkUserId: "clerk-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(writeAuditLog).mockResolvedValue({
      id: "audit-1",
      action: "TEST",
      entityType: "Test",
      entityId: "entity-1",
      metadata: null,
      actorUserId: "user-1",
      createdAt: new Date(),
    });
  });

  it("settle com mapping cria journal", async () => {
    const transaction = {
      id: "tx-1",
      status: "PLANNED",
      categoryId: "cat-1",
      accountId: "acc-1",
      supplierId: "sup-1",
      propertyId: "prop-1",
      settlementDate: null,
      amount: "100.00",
      description: null,
    };

    vi.mocked(
      (mockPrisma.financialTransaction as { findUnique: ReturnType<typeof vi.fn> })
        .findUnique,
    ).mockResolvedValue(transaction);
    vi.mocked(
      (mockPrisma.financialTransaction as { update: ReturnType<typeof vi.fn> }).update,
    ).mockResolvedValue({
      ...transaction,
      status: "SETTLED",
      settlementDate: new Date("2024-01-01T00:00:00.000Z"),
    });
    vi.mocked(
      (mockPrisma.journalEntry as { findUnique: () => Promise<null> }).findUnique,
    ).mockResolvedValue(null);
    vi.mocked(
      (mockPrisma.mappingRule as { findMany: () => Promise<unknown[]> }).findMany,
    ).mockResolvedValue([
      {
        id: "rule-1",
        debitAccountId: "d-1",
        creditAccountId: "c-1",
        supplierId: "sup-1",
        propertyId: "prop-1",
      },
    ]);
    vi.mocked(
      (mockPrisma.journalEntry as { create: () => Promise<unknown> }).create,
    ).mockResolvedValue({
      id: "je-1",
      sourceType: "FINANCIAL",
      sourceId: "tx-1",
      lines: [{ id: "l-1" }, { id: "l-2" }],
    });

    const response = await POST(new Request("http://localhost/settle"), {
      params: Promise.resolve({ id: "tx-1" }),
    });
    const body = await response.json();

    expect(body.ok).toBe(true);
    expect(body.data.journalEntry.id).toBe("je-1");
    expect(body.data.issue).toBeNull();
  });

  it("settle sem mapping cria issue", async () => {
    const transaction = {
      id: "tx-2",
      status: "PLANNED",
      categoryId: "cat-2",
      accountId: "acc-2",
      supplierId: "sup-2",
      propertyId: "prop-2",
      settlementDate: null,
      amount: "200.00",
      description: null,
    };

    vi.mocked(
      (mockPrisma.financialTransaction as { findUnique: ReturnType<typeof vi.fn> })
        .findUnique,
    ).mockResolvedValue(transaction);
    vi.mocked(
      (mockPrisma.financialTransaction as { update: ReturnType<typeof vi.fn> }).update,
    ).mockResolvedValue({
      ...transaction,
      status: "SETTLED",
      settlementDate: new Date("2024-01-02T00:00:00.000Z"),
    });
    vi.mocked(
      (mockPrisma.journalEntry as { findUnique: () => Promise<null> }).findUnique,
    ).mockResolvedValue(null);
    vi.mocked(
      (mockPrisma.mappingRule as { findMany: () => Promise<unknown[]> }).findMany,
    ).mockResolvedValue([]);
    vi.mocked(
      (mockPrisma.accountingIssue as { findFirst: () => Promise<null> }).findFirst,
    ).mockResolvedValue(null);
    vi.mocked(
      (mockPrisma.accountingIssue as { create: () => Promise<unknown> }).create,
    ).mockResolvedValue({
      id: "issue-1",
      reason: "MISSING_MAPPING",
      financialTransactionId: "tx-2",
    });

    const response = await POST(new Request("http://localhost/settle"), {
      params: Promise.resolve({ id: "tx-2" }),
    });
    const body = await response.json();

    expect(body.ok).toBe(true);
    expect(body.data.journalEntry).toBeNull();
    expect(body.data.issue.id).toBe("issue-1");
  });

  it("settle idempotente não duplica journal", async () => {
    const transaction = {
      id: "tx-3",
      status: "PLANNED",
      categoryId: "cat-3",
      accountId: "acc-3",
      supplierId: "sup-3",
      propertyId: "prop-3",
      settlementDate: null,
      amount: "300.00",
      description: null,
    };

    vi.mocked(
      (mockPrisma.financialTransaction as { findUnique: ReturnType<typeof vi.fn> })
        .findUnique,
    ).mockResolvedValue(transaction);
    vi.mocked(
      (mockPrisma.financialTransaction as { update: ReturnType<typeof vi.fn> }).update,
    ).mockResolvedValue({
      ...transaction,
      status: "SETTLED",
      settlementDate: new Date("2024-01-03T00:00:00.000Z"),
    });
    vi.mocked(
      (mockPrisma.journalEntry as { findUnique: () => Promise<unknown> }).findUnique,
    ).mockResolvedValue({
      id: "je-3",
      sourceType: "FINANCIAL",
      sourceId: "tx-3",
      lines: [{ id: "l-1" }, { id: "l-2" }],
    });

    const response = await POST(new Request("http://localhost/settle"), {
      params: Promise.resolve({ id: "tx-3" }),
    });
    const body = await response.json();

    expect(body.ok).toBe(true);
    expect(body.data.journalEntry.id).toBe("je-3");
    expect(
      (mockPrisma.mappingRule as { findMany: ReturnType<typeof vi.fn> }).findMany,
    ).not.toHaveBeenCalled();
  });

  it("RBAC bloqueia acesso", async () => {
    vi.mocked(requireDbUser).mockRejectedValue(
      new AppError({ code: "FORBIDDEN", message: "Sem permissão", status: 403 }),
    );

    const response = await POST(new Request("http://localhost/settle"), {
      params: Promise.resolve({ id: "tx-4" }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
