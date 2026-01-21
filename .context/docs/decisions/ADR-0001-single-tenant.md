# ADR-0001: Single-tenant no MVP

## Status
Aceito

## Contexto
O projeto iniciará com um único ambiente de dados (sem múltiplas empresas).
Precisamos reduzir complexidade inicial e acelerar entrega.

## Decisão
- Não usar Organizations / multi-tenant no MVP.
- Todas as entidades serão globais do sistema.
- Controle de acesso será por RBAC (roles por usuário).

## Consequências
- Prós: implementação mais simples e rápida.
- Contras: para evoluir para SaaS/multi-tenant no futuro, será necessário introduzir `tenantId` e migrações.
