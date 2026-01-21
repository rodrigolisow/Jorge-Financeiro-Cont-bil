# Arquitetura (Next.js + Prisma + Neon + Clerk) — Single-tenant

## Objetivos arquiteturais
- Separar domínio de UI (evitar regra de negócio em componentes)
- Garantir RBAC no backend
- Manter geração contábil idempotente e auditável
- Facilitar evolução (conciliação, importações, relatórios)

## Backend padrão
- **Route Handlers** em `src/app/api/*` para operações do domínio.
- Domínio e casos de uso em `src/server/*`.

## Camadas sugeridas
- `src/app/` (rotas e UI)
- `src/app/api/` (Route Handlers)
- `src/lib/` (infra: prisma, auth, rbac, validação, utilitários)
- `src/server/` (domínio e use-cases)
  - `src/server/finance/`
  - `src/server/accounting/`
  - `src/server/mapping/`
  - `src/server/audit/`

## Localização de código (MVP)
- `src/lib/prisma.ts`: client Prisma (com logging e graceful shutdown)
- `src/lib/auth.ts`: integração Clerk e sessão
- `src/lib/rbac.ts`: regras e guards por role
- `src/lib/errors.ts`: AppError e mapeamento de erros
- `src/lib/http.ts`: helpers de resposta para Route Handlers
- `src/lib/audit.ts`: helper de gravação de AuditLog
- `src/lib/journal.ts`: helpers para operações de diário (estorno)
- `src/server/finance/transactions.ts`: use-cases de transações (create, settle, cancel) ✅
- `src/server/accounting/journal.ts`: use-cases contábeis (create manual, reverse, resolve issue) ✅
- `src/server/index.ts`: re-exports de todos use-cases ✅
- `src/app/api/finance/*`: handlers financeiros
- `src/app/api/accounting/*`: handlers contábeis
- `src/app/app/page.tsx`: rota protegida inicial
- `middleware.ts`: proteção de rotas com Clerk

## Padrões
- Validação de input com Zod
- Erros padronizados (AppError)
- Services/use-cases centralizam regra de negócio (handlers e UI apenas orquestram)

## Integração Financeiro -> Contábil
Use-case: `settleFinancialTransaction()`
1) Atualiza status para SETTLED
2) Resolve mapping (categoria e conta)
3) Se mapping ok: cria `JournalEntry` + `JournalLines` (idempotente)
4) Se mapping faltante: cria `AccountingIssue` (pendência)
5) Bloqueia edição de campos críticos após POSTED

## Observabilidade (mínimo)
- Logs server-side para falhas de geração contábil
- Tabela `AuditLog` para ações críticas com metadata mínima
