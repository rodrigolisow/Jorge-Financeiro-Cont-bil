# Modelo de Dados (conceitual) — Prisma/Postgres — Single-tenant

## Identidades (Clerk)
- Persistir `clerkUserId` em `User`
- A role do usuário vem do banco (RBAC confiável no backend)

## Entidades (resumo)
- User (clerkUserId, role)
- Supplier
- Property
- FinancialAccount
- FinancialCategory
- FinancialTransaction
- ChartOfAccount
- JournalEntry
- JournalLine
- MappingRule
- AccountingIssue
- AccountingPeriod (evolução)
- Attachment (opcional MVP)
- AuditLog

## Constraints importantes
- Idempotência:
  - Unique em `JournalEntry(sourceType, sourceId)`
- Performance:
  - Índices em datas, status, (supplierId, propertyId), (categoryId, accountId)

## Eventos auditáveis
- create/update/settle/cancel de FinancialTransaction
- create/reverse de JournalEntry
- changes em MappingRule
- create/resolve de AccountingIssue
- close/open AccountingPeriod (quando entrar)

## Enums (v1)
- Role: ADMIN, FINANCE, ACCOUNTING, VIEWER
- FinancialTransactionStatus: PLANNED, SETTLED, CANCELED
- FinancialTransactionType: INCOME, EXPENSE
- FinancialAccountType: BANK, CASH, OTHER
- FinancialCategoryType: INCOME, EXPENSE
- ChartOfAccountType: ASSET, LIABILITY, EQUITY, INCOME, EXPENSE
- JournalEntryStatus: POSTED, REVERSED
- JournalEntrySourceType: MANUAL, FINANCIAL
- AccountingIssueStatus: OPEN, RESOLVED, IGNORED

## Campos principais (v1)
- User: clerkUserId, role
- Supplier: name, document
- Property: name, code
- FinancialAccount: name, type
- FinancialCategory: name, type
- FinancialTransaction: type, status, amount, competenceDate, settlementDate, accountId, categoryId, supplierId, propertyId, createdById
- ChartOfAccount: code, name, type, parentId
- JournalEntry: date, description, status, sourceType, sourceId, createdById
- JournalLine: entryId, accountId, debit, credit, memo
- MappingRule: financialCategoryId, financialAccountId, supplierId, propertyId, debitAccountId, creditAccountId
- AccountingIssue: status, reason, details, financialTransactionId, resolvedAt, resolvedById
- AuditLog: action, entityType, entityId, metadata, actorUserId
- AuditLog.metadata: somente identificadores, status e totais (sem dados sensíveis)
