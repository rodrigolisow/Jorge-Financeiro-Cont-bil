# Domain: Financeiro (UX Atualizado)

## Estrutura Atual
- **Visão Geral**: Dashboard com KPIs e atalhos.
- **Lançamentos**:
  - Listagem com filtros avançados, totais em tempo real e status coloridos.
  - Formulário moderno (Wizard-like) em cards: "Dados", "Vinculações", "Datas".
- **Cadastros Auxiliares**:
  - Fornecedores, Imóveis, Contas, Categorias
  - CRUDs padronizados com tabela de listagem e modal/drawer de edição.

## Principais Fluxos
1. **Novo Lançamento**: 
   - Usuário acessa `/app/finance/transactions/new`.
   - Preenche tipo, valor, descrição.
   - Vincula obrigatoriamente a uma Categoria e Conta (para garantir integridade contábil).
   - Salva -> Redireciona para lista.

2. **Liquidação (Baixa)**:
   - Usuário acessa lista ou detalhes.
   - Clica em "Marcar como realizado".
   - Confirma ação.
   - Sistema gera movimento contábil automático (se configurado).

3. **Status do Lançamento**:
   - `PLANNED` (Previsto): Apenas financeiro, não afeta contabilidade real (apenas provisão se houver).
   - `SETTLED` (Realizado): Ocorre o fato gerador financeiro.
   - `CANCELED` (Cancelado): Estorno ou exclusão lógica.

## Design System Aplicado
- **Cores**: 
   - Receitas: Emerald (Verde).
   - Despesas: Red (Vermelho).
   - Ações Principais: Cyan (Brand).
- **Componentes**:
   - `PageHeader` para títulos contextuais.
   - `Card` para agrupamento lógico.
   - `Badge` para status visual rápido.
