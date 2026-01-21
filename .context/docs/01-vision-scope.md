# Visão, Escopo e Não-Escopo

## Visão
Sistema simples, auditável e escalável para gestão Financeira e Contábil integrada, com foco em:
- rastreabilidade (origem->reflexo)
- consistência (idempotência e regras claras)
- evolução incremental (MVP sólido)

## Escopo do MVP
- Módulos Financeiro e Contábil
- Mapeamento mínimo e fila de pendências
- RBAC básico via Clerk + tabela User (role)
- Single-tenant (sem isolamento por org)

## Não-Escopo do MVP
- Integrações bancárias automáticas
- Open Finance
- SPED/fiscal completo
- Emissão de boletos/NF
