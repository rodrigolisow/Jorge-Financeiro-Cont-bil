# Domínio — Contábil

## Entidades
- ChartOfAccount (Plano de contas, hierárquico)
- JournalEntry (Diário: cabeçalho)
- JournalLine (linhas: débito/crédito)
- AccountingIssue (pendências de integração)
- MappingRule (regra de mapeamento)
- AccountingPeriod (evolução)

## Regras de partida dobrada
- Um `JournalEntry` deve ter soma de débitos == soma de créditos.
- `JournalLine` deve ter exatamente um de `debit` ou `credit` > 0.

## Origem
- MANUAL: criado por usuário contábil
- FINANCIAL: gerado a partir do financeiro (sourceId obrigatório)

## Integração financeiro (MVP)
- Geração contábil idempotente (unique sourceType+sourceId)
- Se faltar mapping, cria AccountingIssue OPEN

## Lançamento manual (MVP)
- Criado apenas por ACCOUNTING/ADMIN
- Lista permite filtros por data
- Validações: linha com débito ou crédito e totais balanceados

## Mapping rules (MVP)
- Liga categoria financeira + conta financeira a contas contábeis (débito/crédito)
- Permite recorte opcional por fornecedor e imóvel

## Accounting issues (MVP)
- Criada quando não existe mapeamento suficiente para gerar contábil
- Pode ser resolvida por ACCOUNTING/ADMIN, com auditoria (resolvedAt/resolvedBy)

## Status sugeridos
- JournalEntry.status:
  - POSTED (padrão)
  - REVERSED (estornado)
- Estorno:
  - Cria novo JournalEntry inverso e marca o original como REVERSED
- AccountingIssue.status:
  - OPEN
  - RESOLVED
  - IGNORED (com justificativa e auditoria)

## Fechamento de período (evolução)
- `AccountingPeriod` OPEN/CLOSED por mês
- Regra futura: não permitir POST/EDIT em mês fechado sem permissão e trilha de auditoria
