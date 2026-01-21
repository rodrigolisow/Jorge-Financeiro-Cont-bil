# Fluxos e UI (Atualizado)

## Rotas Principais

### / (Landing Page - Pública)
- **Status da UI**: ✅ Implementada (v2)
- **Objetivo**: Apresentar a solução e converter visitantes.

### /app (Dashboard - Protegida)
- **Status da UI**: ✅ Refatorada (v1 - Prompt 3)
- **Layout**:
  - **Sidebar**: Fixa à esquerda (16rem), branca, com navegação agrupada (Financeiro / Contábil). Responsiva (Overlay no mobile).
  - **Topbar**: Título da seção (Breadcrumb dinâmico) + UserButton à direita.
  - **Main**: Área de conteúdo com padding (2rem).
- **Home (/app)**:
  - Header: Boas vindas + Nível do usuário.
  - KPIs: Cards simples com métricas (mock para MVP).
  - Seções: Cards de navegação rápida para Financeiro e Contábil.
  - **Interação**: Cards possuem hover effect e levam às sub-rotas.

## Padrões de Navegação
- Sidebar mantém estado ativo visualmente.
- Breadcrumbs no header ajudam a entender a localização (`Financeiro > Lançamentos`).
- Design System aplicado a todos os elementos (Fontes, Cores, Radius).
