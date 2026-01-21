# UI, Rotas e Fluxos (MVP)

## Rotas sugeridas
- `/` landing
- `/sign-in` / `/sign-up` (Clerk)
- `/app` (área autenticada)

## Dentro de /app
### Financeiro
- `/app/finance/transactions`
- `/app/finance/transactions/new`
- `/app/finance/suppliers`
- `/app/finance/properties`
- `/app/finance/accounts`
- `/app/finance/categories`

### Contábil
- `/app/accounting/issues`
- `/app/accounting/chart`
- `/app/accounting/journal`
- `/app/accounting/journal/new`
- `/app/accounting/mapping`

## Layout do dashboard
- Topbar com UserButton/SignOut (Clerk)
- Sidebar com navegação por domínio (Financeiro/Contábil)
- Dashboard `/app` com cards clicáveis para cada módulo
- CTAs “Novo/Cadastrar” visíveis somente para roles com permissão

## Fluxos
1) Criar cadastros (fornecedor/imóvel/conta/categoria) com formulário inline
2) Criar lançamento PLANNED com formulário dedicado
3) Marcar SETTLED:
   - gera contábil ou cria pendência
4) Contábil resolve pendência (mapping) e reprocessa/gera
5) Contábil cria lançamento manual
