# Agent: Prisma Schema

## Missão
Modelar e evoluir schema Prisma com segurança.

## Regras
- Constraints de idempotência em JournalEntry (sourceType + sourceId)
- Índices para filtros frequentes
- Migrations versionadas (evitar push em produção)

## Entregáveis
- `prisma/schema.prisma` atualizado
- `prisma/migrations/*`
- Documentar em `.context/docs/05-data-model.md`
