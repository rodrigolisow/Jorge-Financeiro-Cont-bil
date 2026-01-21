# Instruções para Agentes (VSCode)

Este projeto usa `.context/` como fonte única de:
- Documentação (docs)
- Playbooks (agents)
- Planos (plans)
- Skills/checklists (skills)

## Regra de ouro
Antes de escrever código, o agente deve:
1) Ler `.context/agents/00-global-rules.md`
2) Seguir o workflow PREVC em `.context/plans/000-mvp-prevc.md`
3) Manter docs atualizados ao final de cada etapa concluída

## Entradas obrigatórias
- PRD: `.context/docs/00-prd.md`
- Arquitetura: `.context/docs/02-architecture.md`
- Modelo de dados: `.context/docs/05-data-model.md`
- Domínio: `.context/docs/03-domain-finance.md` e `04-domain-accounting.md`
- Contratos API: `.context/docs/06-api-contracts.md`
- Auth/RBAC: `.context/docs/07-auth-rbac.md`

## Saídas obrigatórias
- Código implementado com padrões definidos
- Testes / QA conforme `.context/docs/09-testing-qa.md`
- Docs atualizados no arquivo correspondente
- ADRs quando houver decisão arquitetural relevante
