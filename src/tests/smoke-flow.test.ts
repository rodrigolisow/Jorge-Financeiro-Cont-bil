import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { POST as createSupplier } from "@/app/api/finance/suppliers/route";
import { POST as createProperty } from "@/app/api/finance/properties/route";
import { POST as createAccount } from "@/app/api/finance/accounts/route";
import { POST as createCategory } from "@/app/api/finance/categories/route";
import { POST as createTransaction } from "@/app/api/finance/transactions/route";
import { POST as settleTransaction } from "@/app/api/finance/transactions/[id]/settle/route";
import { POST as createChartAccount } from "@/app/api/accounting/chart/route";
import { POST as createMapping } from "@/app/api/accounting/mapping/route";
import { prisma } from "@/lib/prisma";

const clerkMocks = vi.hoisted(() => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => clerkMocks);

const jsonRequest = (url: string, body: unknown) =>
  new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("smoke flow financeiro-contábil", () => {
  const created = {
    supplierId: "",
    propertyId: "",
    accountId: "",
    categoryId: "",
    debitAccountId: "",
    creditAccountId: "",
    mappingId: "",
    transactionId: "",
  };

  beforeAll(() => {
    vi.mocked(clerkMocks.auth).mockResolvedValue({ userId: "smoke-user" });
    vi.mocked(clerkMocks.currentUser).mockResolvedValue({
      id: "clerk-user",
      firstName: "Smoke",
      lastName: "Test",
      emailAddresses: [{ emailAddress: "lisowdesenvolver@gmail.com" }],
    });
  });

  afterAll(async () => {
    if (created.transactionId) {
      await prisma.journalEntry.deleteMany({
        where: {
          sourceType: "FINANCIAL",
          sourceId: created.transactionId,
        },
      });
      await prisma.accountingIssue.deleteMany({
        where: { financialTransactionId: created.transactionId },
      });
      await prisma.financialTransaction.deleteMany({
        where: { id: created.transactionId },
      });
    }
    if (created.mappingId) {
      await prisma.mappingRule.deleteMany({ where: { id: created.mappingId } });
    }
    if (created.accountId) {
      await prisma.financialAccount.deleteMany({ where: { id: created.accountId } });
    }
    if (created.categoryId) {
      await prisma.financialCategory.deleteMany({ where: { id: created.categoryId } });
    }
    if (created.supplierId) {
      await prisma.supplier.deleteMany({ where: { id: created.supplierId } });
    }
    if (created.propertyId) {
      await prisma.property.deleteMany({ where: { id: created.propertyId } });
    }
    if (created.debitAccountId) {
      await prisma.chartOfAccount.deleteMany({
        where: { id: created.debitAccountId },
      });
    }
    if (created.creditAccountId) {
      await prisma.chartOfAccount.deleteMany({
        where: { id: created.creditAccountId },
      });
    }
    const entityIds = Object.values(created).filter(Boolean);
    if (entityIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: { entityId: { in: entityIds } },
      });
    }
  });

  it("cria cadastros, lançamento e liquida com journal", async () => {
    const suffix = Date.now();

    const supplierRes = await createSupplier(
      jsonRequest("http://localhost/api/finance/suppliers", {
        name: `Fornecedor Smoke ${suffix}`,
        document: "00000000000191",
      }),
    );
    const supplierBody = await supplierRes.json();
    expect(supplierBody.ok).toBe(true);
    created.supplierId = supplierBody.data.id;

    const propertyRes = await createProperty(
      jsonRequest("http://localhost/api/finance/properties", {
        name: `Imóvel Smoke ${suffix}`,
        code: `IM-${suffix}`,
      }),
    );
    const propertyBody = await propertyRes.json();
    expect(propertyBody.ok).toBe(true);
    created.propertyId = propertyBody.data.id;

    const accountRes = await createAccount(
      jsonRequest("http://localhost/api/finance/accounts", {
        name: `Conta Smoke ${suffix}`,
        type: "BANK",
      }),
    );
    const accountBody = await accountRes.json();
    expect(accountBody.ok).toBe(true);
    created.accountId = accountBody.data.id;

    const categoryRes = await createCategory(
      jsonRequest("http://localhost/api/finance/categories", {
        name: `Categoria Smoke ${suffix}`,
        type: "EXPENSE",
      }),
    );
    const categoryBody = await categoryRes.json();
    expect(categoryBody.ok).toBe(true);
    created.categoryId = categoryBody.data.id;

    const debitAccountRes = await createChartAccount(
      jsonRequest("http://localhost/api/accounting/chart", {
        code: `1.${suffix}`,
        name: `Caixa Smoke ${suffix}`,
        type: "ASSET",
        parentId: null,
      }),
    );
    const debitBody = await debitAccountRes.json();
    expect(debitBody.ok).toBe(true);
    created.debitAccountId = debitBody.data.id;

    const creditAccountRes = await createChartAccount(
      jsonRequest("http://localhost/api/accounting/chart", {
        code: `2.${suffix}`,
        name: `Despesa Smoke ${suffix}`,
        type: "EXPENSE",
        parentId: null,
      }),
    );
    const creditBody = await creditAccountRes.json();
    expect(creditBody.ok).toBe(true);
    created.creditAccountId = creditBody.data.id;

    const mappingRes = await createMapping(
      jsonRequest("http://localhost/api/accounting/mapping", {
        financialCategoryId: created.categoryId,
        financialAccountId: created.accountId,
        supplierId: null,
        propertyId: null,
        debitAccountId: created.debitAccountId,
        creditAccountId: created.creditAccountId,
      }),
    );
    const mappingBody = await mappingRes.json();
    expect(mappingBody.ok).toBe(true);
    created.mappingId = mappingBody.data.id;

    const transactionRes = await createTransaction(
      jsonRequest("http://localhost/api/finance/transactions", {
        type: "EXPENSE",
        amount: 150,
        competenceDate: new Date().toISOString(),
        settlementDate: null,
        description: "Lançamento smoke",
        accountId: created.accountId,
        categoryId: created.categoryId,
        supplierId: created.supplierId,
        propertyId: created.propertyId,
      }),
    );
    const transactionBody = await transactionRes.json();
    expect(transactionBody.ok).toBe(true);
    created.transactionId = transactionBody.data.id;

    const settleRes = await settleTransaction(
      new Request(
        `http://localhost/api/finance/transactions/${created.transactionId}/settle`,
      ),
      { params: Promise.resolve({ id: created.transactionId }) },
    );
    const settleBody = await settleRes.json();
    expect(settleBody.ok).toBe(true);
    expect(settleBody.data.journalEntry).not.toBeNull();
    expect(settleBody.data.issue).toBeNull();
  }, 30000);
});
