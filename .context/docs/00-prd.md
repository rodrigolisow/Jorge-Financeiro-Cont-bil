# PRD — Sistema Financeiro + Contábil Integrado (Single-tenant)

## 1) Objetivo
Construir um sistema com dois módulos integrados:
- **Financeiro**: origem dos lançamentos (receitas/despesas), com vínculo a fornecedor e imóvel.
- **Contábil**: registros contábeis (débito/crédito) gerados a partir do financeiro e também lançados manualmente.
- **Integração**: quando um lançamento financeiro for “Realizado”, o sistema gera o lançamento contábil correspondente, mantendo rastreabilidade. Se faltarem regras de mapeamento, cria pendência para resolução.

## 2) MVP (escopo mínimo)
### Financeiro
- CRUD Fornecedor
- CRUD Imóvel
- CRUD Conta Financeira (Banco/Caixa)
- CRUD Categoria Financeira (Receita/Despesa)
- CRUD Lançamento Financeiro:
  - type: REVENUE | EXPENSE
  - amount
  - competenceDate (obrigatório)
  - settlementDate (opcional, recomendado)
  - status: PLANNED | SETTLED | CANCELED
  - vínculos: supplierId? propertyId? accountId categoryId
  - description

### Contábil
- Plano de contas (hierárquico)
- Lançamento contábil (Diário):
  - cabeçalho (data, histórico, origem)
  - linhas (débito/crédito por conta)
  - manual e gerado do financeiro

### Integração
- Regras mínimas:
  - Categoria Financeira -> Conta Contábil (resultado)
  - Conta Financeira -> Conta Contábil (banco/caixa)
- Gatilho de geração: ao transacionar para SETTLED
- Se faltar regra: pendência explícita (“PENDING_MAPPING”)

## 3) Regras de negócio (MVP)
- Um lançamento contábil gerado deve ter:
  - `sourceType = FINANCIAL`
  - `sourceId = <financialTransactionId>`
- Deve ser idempotente: reprocessar não pode duplicar (unique por sourceType+sourceId)
- Alterações em lançamento financeiro após contabilidade gerada:
  - MVP: bloquear edição de campos críticos quando existir `JournalEntry` POSTED vinculado.
  - Para correção: estorno + novo lançamento (financeiro) ou ajuste manual (contábil) com auditoria.
- Exclusão destrutiva não permitida para registros sensíveis (usar cancelamento/estorno).

## 4) Critérios de aceite (MVP)
1) Criar fornecedor e imóvel.
2) Criar lançamento financeiro PLANNED.
3) Marcar lançamento como SETTLED:
   - Se houver mapeamento: gera lançamento contábil (débitos = créditos) e vínculo ao financeiro.
   - Se faltar mapeamento: não gera contábil e cria pendência visível.
4) Criar lançamento contábil manual.
5) Listagens com filtros por período, fornecedor e imóvel.
6) Logs mínimos de auditoria para operações críticas.

## 5) Evolução (Roadmap)
### Fase 2 (Operação e controle)
- Importação de extratos (CSV/OFX)
- Conciliação bancária
- Rateio (despesa distribuída entre imóveis/centros)
- Lançamentos recorrentes
- Anexos (documentos) vinculados a lançamentos

### Fase 3 (Contábil mais robusto)
- Razão por conta (com saldo)
- Balancete simples
- Fechamento mensal com checklist e travas
- Estornos e reclassificações estruturados

### Fase 4 (Automação e integrações)
- Workflows de aprovação
- Exportações (CSV/Excel) e integrações com sistemas contábeis
- Alertas (documentos faltantes, mapeamento ausente, lançamentos fora do período)
