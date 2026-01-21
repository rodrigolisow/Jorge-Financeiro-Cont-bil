# Contratos de API — Padrão (Route Handlers)

## Estilo
- Route Handlers em `src/app/api/*`
- Zod para validação de input (body/query)
- Respostas consistentes (ok/error)
- RBAC sempre aplicado no backend

## Padrão de erros
- VALIDATION_ERROR
- UNAUTHORIZED
- FORBIDDEN
- NOT_FOUND
- CONFLICT (ex.: idempotência)
- PRECONDITION_FAILED (ex.: período fechado no futuro)
- INTERNAL_ERROR

## Recursos (MVP)
### Financeiro
- `/api/finance/suppliers` (GET, POST)
- `/api/finance/suppliers/:id` (GET, PATCH, DELETE)
- `/api/finance/properties` (GET, POST)
- `/api/finance/properties/:id` (GET, PATCH, DELETE)
- `/api/finance/accounts` (GET, POST)
- `/api/finance/accounts/:id` (GET, PATCH, DELETE)
- `/api/finance/categories` (GET, POST)
- `/api/finance/categories/:id` (GET, PATCH, DELETE)
- `/api/finance/transactions` (GET, POST)
- `/api/finance/transactions/:id` (GET, PATCH)
- `/api/finance/transactions/:id/settle` (POST)
- `/api/finance/transactions/:id/cancel` (POST)

### Contábil
- `/api/accounting/chart` (GET, POST)
- `/api/accounting/chart/:id` (GET, PATCH, DELETE)
- `/api/accounting/journal` (GET, POST manual)
- `/api/accounting/journal/:id` (GET)
- `/api/accounting/journal/:id/reverse` (POST)
- `/api/accounting/mapping` (GET, POST)
- `/api/accounting/mapping/:id` (GET, PATCH, DELETE)
- `/api/accounting/issues` (GET)
- `/api/accounting/issues/:id/resolve` (POST)

### Período (evolução)
- `/api/accounting/periods` (GET)
- `/api/accounting/periods/:id/close` (POST)
