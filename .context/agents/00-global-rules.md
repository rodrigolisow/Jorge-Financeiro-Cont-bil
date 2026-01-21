# Regras Globais para Agentes

## Obrigatório
1) Código limpo, escalável e robusto (padrão sênior).
2) Não inventar regra: se não estiver em `.context/docs/`, atualizar doc ou criar ADR antes.
3) RBAC aplicado no backend (não confiar só no frontend).
4) Idempotência: geração contábil não pode duplicar.
5) Auditoria: registrar eventos críticos.
6) Ao concluir etapa: revisar e documentar no doc correspondente.

## Padrões de implementação
- Zod para validação
- Use-cases em `src/server/*`
- Handlers e UI apenas orquestram
- Infra (prisma, auth, rbac) em `src/lib/*`

## Definition of Done
- Fluxos principais funcionando
- Erros tratados
- RBAC aplicado
- Migrations corretas
- Docs atualizados
