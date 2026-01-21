# Domínio — Financeiro

## Entidades
- Supplier (Fornecedor)
- Property (Imóvel)
- FinancialAccount (Conta Financeira)
- FinancialCategory (Categoria)
- FinancialTransaction (Lançamento)

## Regras
- `FinancialTransaction.status`:
  - PLANNED: previsto
  - SETTLED: realizado
  - CANCELED: cancelado
- Campos críticos:
  - type, amount, competenceDate, accountId, categoryId, supplierId, propertyId
- Ao transicionar PLANNED -> SETTLED:
  - dispara tentativa de geração contábil idempotente
  - se faltar mapping, cria AccountingIssue OPEN
- Alteração pós-contabilização:
  - MVP: se já houver `JournalEntry` POSTED vinculado, bloquear edição de campos críticos.
  - Para correção: estorno + novo lançamento (ou ajuste contábil manual com auditoria).
- Cancelamento:
  - Se houver `JournalEntry` POSTED vinculado, exige estorno contábil no fluxo de cancelamento.

## Filtros e relatórios (MVP)
- Por período (competência e/ou realização)
- Por fornecedor
- Por imóvel
- Por categoria
- Por conta financeira
- Por status (PLANNED/SETTLED/CANCELED)
