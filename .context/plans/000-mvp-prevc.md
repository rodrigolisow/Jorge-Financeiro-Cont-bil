# Plano — MVP (PREVC)

## P — Planning
1) Confirmar PRD e escopo MVP (00-prd.md)
2) Confirmar rotas e fluxos (08-ui-routes-flows.md)
3) Confirmar contratos (06-api-contracts.md)

Gate P: plano de tarefas do MVP definido.

### Plano de tarefas do MVP (1–12)
1) Bootstrap do app (Next.js, envs, Prisma/Neon, Clerk, lint/typecheck)
2) Infra de auth + RBAC (User, roles, guards de backend)
3) Schema Prisma completo + migrations + índices + constraints de idempotência
4) CRUD Financeiro (suppliers, properties, accounts, categories, transactions)
5) Use-cases Financeiro (criar, editar, cancelar, filtrar)
6) CRUD Contábil (chart of accounts, journal manual)
7) Mapping rules + AccountingIssue (CRUD + resolve)
8) settleFinancialTransaction com idempotência + criação de issue
9) Auditoria mínima (AuditLog em ações críticas)
10) UI Financeiro (listas + formulários + filtros)
11) UI Contábil (chart, journal, mapping, issues)
12) Testes críticos + checklist manual RBAC

### Riscos e dependências
- Migrations e constraints precisam sair antes dos handlers
- Idempotência exige unique em JournalEntry (sourceType, sourceId)
- RBAC deve ser aplicado em todos os handlers
- settle depende de mapping e transações consistentes
- Auditoria precisa integrar com casos de uso críticos

### Mapeamento de código (proposta)
- `src/lib/`: prisma, auth/clerk, rbac, erros e utilitários
- `src/server/finance/`: entidades e use-cases do financeiro
- `src/server/accounting/`: entidades e use-cases contábeis
- `src/server/mapping/`: regras de mapeamento e issues
- `src/server/audit/`: gravação de AuditLog
- `src/app/api/`: route handlers por recurso
- `src/app/`: rotas e UI

## R — Review
1) Confirmar decisões (ADRs 0001 e 0002)
2) Confirmar modelagem (05-data-model.md)
3) Confirmar estratégia de idempotência e auditoria

Gate R: decisões registradas e docs alinhados.

## E — Execution (ordem recomendada)
1) Setup Clerk + RBAC base
2) Prisma schema + migrations (users + cadastros)
3) Financeiro: CRUD + settle
4) Contábil: plano de contas + journal manual
5) Mapping rules + issues
6) Geração contábil idempotente
7) UI e filtros
8) Auditoria
9) Estorno/cancelamento (se entrar no MVP)

## V — Validation
1) Testes (use-cases críticos)
2) Checklist manual RBAC
3) Verificar idempotência e pendências

## C — Confirmation
1) Docs finais atualizados
2) Checklist de release
3) Deploy e smoke tests
