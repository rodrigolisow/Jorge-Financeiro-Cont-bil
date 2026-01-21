# ADR-0002: Backend padrão via Route Handlers

## Status
Aceito

## Contexto
O app terá múltiplas operações CRUD + regras de negócio (settle/idempotência/auditoria).
Precisamos de um backend consistente, testável e fácil de evoluir.

## Decisão
- Usar Route Handlers em `src/app/api/*` como padrão de backend.
- Centralizar regras em `src/server/*` (use-cases), e não nos handlers/ UI.
- Validação com Zod e enforcement de RBAC no backend.

## Consequências
- Prós: previsibilidade, facilidade de testes, boa evolução para integrações futuras.
- Contras: mais arquivos/estrutura do que usar Server Actions para tudo.
