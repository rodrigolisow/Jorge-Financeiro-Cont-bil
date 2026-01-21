# .context — Fonte Única de Verdade

Esta pasta concentra:
- `docs/`: documentação viva (produto, arquitetura, domínio, dados, API, UI, segurança, deploy)
- `agents/`: playbooks (como o agente deve trabalhar)
- `plans/`: planos de execução alinhados ao workflow PREVC
- `skills/`: checklists sob demanda (PR review, mudanças de DB, segurança, testes, release)

## PREVC
- P (Planning): especificações e recortes de escopo (sem código)
- R (Review): arquitetura, riscos, decisões (ADRs)
- E (Execution): implementação guiada pelas specs
- V (Validation): testes + QA + revisão contra critérios de aceite
- C (Confirmation): documentação final + checklist de release/deploy
