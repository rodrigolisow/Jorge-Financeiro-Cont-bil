# Deploy e Operações (Vercel + Neon)

## Variáveis de ambiente (mínimo)
- DATABASE_URL (Neon)
- Prisma (se aplicável): DIRECT_URL
- Clerk:
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  - CLERK_SECRET_KEY
  - (opcional) CLERK_WEBHOOK_SECRET

## Prisma em produção
- Migrations versionadas
- Preferir `prisma migrate deploy` em produção
- Evitar `db push` em produção

## Observabilidade
- Logs de erros
- (futuro) Sentry / APM
