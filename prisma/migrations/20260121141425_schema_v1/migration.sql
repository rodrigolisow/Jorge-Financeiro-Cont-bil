-- CreateEnum
CREATE TYPE "FinancialTransactionStatus" AS ENUM ('PLANNED', 'SETTLED', 'CANCELED');

-- CreateEnum
CREATE TYPE "FinancialTransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "FinancialAccountType" AS ENUM ('BANK', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "FinancialCategoryType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "ChartOfAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "JournalEntryStatus" AS ENUM ('POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "JournalEntrySourceType" AS ENUM ('MANUAL', 'FINANCIAL');

-- CreateEnum
CREATE TYPE "AccountingIssueStatus" AS ENUM ('OPEN', 'RESOLVED', 'IGNORED');

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FinancialAccountType" NOT NULL DEFAULT 'BANK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FinancialCategoryType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" TEXT NOT NULL,
    "type" "FinancialTransactionType" NOT NULL,
    "status" "FinancialTransactionStatus" NOT NULL DEFAULT 'PLANNED',
    "amount" DECIMAL(14,2) NOT NULL,
    "competenceDate" TIMESTAMP(3) NOT NULL,
    "settlementDate" TIMESTAMP(3),
    "description" TEXT,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChartOfAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ChartOfAccountType" NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChartOfAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" "JournalEntryStatus" NOT NULL DEFAULT 'POSTED',
    "sourceType" "JournalEntrySourceType" NOT NULL,
    "sourceId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "memo" TEXT,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MappingRule" (
    "id" TEXT NOT NULL,
    "financialCategoryId" TEXT NOT NULL,
    "financialAccountId" TEXT NOT NULL,
    "supplierId" TEXT,
    "propertyId" TEXT,
    "debitAccountId" TEXT NOT NULL,
    "creditAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MappingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingIssue" (
    "id" TEXT NOT NULL,
    "status" "AccountingIssueStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "details" JSONB,
    "financialTransactionId" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE INDEX "Property_name_idx" ON "Property"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Property_code_key" ON "Property"("code");

-- CreateIndex
CREATE INDEX "FinancialAccount_name_idx" ON "FinancialAccount"("name");

-- CreateIndex
CREATE INDEX "FinancialCategory_name_idx" ON "FinancialCategory"("name");

-- CreateIndex
CREATE INDEX "FinancialTransaction_competenceDate_idx" ON "FinancialTransaction"("competenceDate");

-- CreateIndex
CREATE INDEX "FinancialTransaction_settlementDate_idx" ON "FinancialTransaction"("settlementDate");

-- CreateIndex
CREATE INDEX "FinancialTransaction_status_idx" ON "FinancialTransaction"("status");

-- CreateIndex
CREATE INDEX "FinancialTransaction_supplierId_idx" ON "FinancialTransaction"("supplierId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_propertyId_idx" ON "FinancialTransaction"("propertyId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_categoryId_idx" ON "FinancialTransaction"("categoryId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_accountId_idx" ON "FinancialTransaction"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "ChartOfAccount_code_key" ON "ChartOfAccount"("code");

-- CreateIndex
CREATE INDEX "ChartOfAccount_name_idx" ON "ChartOfAccount"("name");

-- CreateIndex
CREATE INDEX "JournalEntry_date_idx" ON "JournalEntry"("date");

-- CreateIndex
CREATE INDEX "JournalEntry_status_idx" ON "JournalEntry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_sourceType_sourceId_key" ON "JournalEntry"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "JournalLine_entryId_idx" ON "JournalLine"("entryId");

-- CreateIndex
CREATE INDEX "JournalLine_accountId_idx" ON "JournalLine"("accountId");

-- CreateIndex
CREATE INDEX "MappingRule_financialCategoryId_financialAccountId_idx" ON "MappingRule"("financialCategoryId", "financialAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "MappingRule_financialCategoryId_financialAccountId_supplier_key" ON "MappingRule"("financialCategoryId", "financialAccountId", "supplierId", "propertyId");

-- CreateIndex
CREATE INDEX "AccountingIssue_status_idx" ON "AccountingIssue"("status");

-- CreateIndex
CREATE INDEX "AccountingIssue_financialTransactionId_idx" ON "AccountingIssue"("financialTransactionId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinancialCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartOfAccount" ADD CONSTRAINT "ChartOfAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingRule" ADD CONSTRAINT "MappingRule_financialCategoryId_fkey" FOREIGN KEY ("financialCategoryId") REFERENCES "FinancialCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingRule" ADD CONSTRAINT "MappingRule_financialAccountId_fkey" FOREIGN KEY ("financialAccountId") REFERENCES "FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingRule" ADD CONSTRAINT "MappingRule_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingRule" ADD CONSTRAINT "MappingRule_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingRule" ADD CONSTRAINT "MappingRule_debitAccountId_fkey" FOREIGN KEY ("debitAccountId") REFERENCES "ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingRule" ADD CONSTRAINT "MappingRule_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingIssue" ADD CONSTRAINT "AccountingIssue_financialTransactionId_fkey" FOREIGN KEY ("financialTransactionId") REFERENCES "FinancialTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingIssue" ADD CONSTRAINT "AccountingIssue_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
