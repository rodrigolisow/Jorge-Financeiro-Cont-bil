# Auth (Clerk) + RBAC — Single-tenant

## Auth
- Clerk para autenticação.
- Rotas `/app/*` protegidas.

## Roles (mínimo)
- ADMIN
- FINANCE
- ACCOUNTING
- VIEWER

## Regras de permissão (recomendação)
- FINANCE:
  - CRUD Financeiro
  - Leitura Contábil
- ACCOUNTING:
  - CRUD Contábil
  - Leitura Financeiro
  - Resolver pendências
- ADMIN:
  - Tudo (inclui mapping)
- VIEWER:
  - Leitura

## Enforcement
- Frontend: esconder ações por role (UX)
- Backend: **sempre** validar role e autenticação antes do use-case

## Implementação base (Bootstrap)
- `middleware.ts` protege `/app/*` e `/api/*`
- `src/lib/auth.ts` centraliza `requireAuth()`
- `src/lib/auth.ts` centraliza `getOrCreateDbUser()` e `requireDbUser()`
- `src/lib/rbac.ts` centraliza `requireRole()` e tipos de role
- `src/app/app/page.tsx` exibe usuário e role atual
- `src/app/sign-in/*` e `src/app/sign-up/*` habilitam Clerk UI

## Persistência de role
- Tabela `User` no banco:
  - `clerkUserId`
  - `role`
- O backend deve confiar no DB como fonte de verdade do role.
- Primeiro login:
  - Role padrão: `VIEWER`
  - Se `BOOTSTRAP_ADMIN_EMAIL` casar com o email do usuário: `ADMIN`
