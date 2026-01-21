# Testes e QA

## MVP: mínimo aceitável
- Use-cases críticos:
  - criar transação financeira
  - settle -> gera contábil com mapping
  - settle -> cria issue sem mapping
  - idempotência: reprocessar não duplica
  - RBAC bloqueia ações proibidas
- Testes automatizados:
  - settle com mapping
  - settle sem mapping
  - idempotência
  - RBAC
- Checklist manual (UI)

## Checklist manual (resumo)
- VIEWER não edita nada
- FINANCE não altera mapeamento
- ACCOUNTING cria journal manual e resolve issue
- SETTLED gera journal corretamente quando mapping existe
- Issue aparece quando falta mapping
- Relatório financeiro respeita filtros, paginação e totais
- Diário contábil filtra por período/conta e abre detalhe
- Cancelamento financeiro estorna quando há journal vinculado
