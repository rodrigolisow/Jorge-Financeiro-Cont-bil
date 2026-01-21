# Design System & UI Documentation

## Core Principles
- **Clean & Professional**: White background, high contrast text, minimal clutter.
- **Accent Color**: Cyan (`#06b6d4`) used for primary actions and active states.
- **Consistency**: Reusable components for all interactions.

## Color Palette
### Base
- `background`: #ffffff (Main app background is slightly off-white #f8fafc in body, cards are white)
- `foreground`: #0f172a (Primary text)
- `muted`: #64748b (Secondary text)

### Accent (Cyan)
- `primary`: #06b6d4
- `primary-hover`: #0891b2

### Functional
- `danger`: #ef4444
- `success`: #10b981
- `border`: #e2e8f0

## Typography
- Font Family: Geist Sans (System UI fallback)
- Weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

## Components

### Button
Values: `primary` (default), `secondary`, `ghost`, `destructive`
Sizes: `sm`, `md`, `lg`

### Select
Native-like select component with consistent styling matching Inputs. Support for grouped options.

### Table
Modern table component for dense data display.
Structure: `Table` > `TableHeader` > `TableRow` > `TableHead` / `TableBody` > `TableRow` > `TableCell`.
Features: Clean, bordered or borderless variants, supports responsive containers.

### Badge
Small status indicators.
Variants: `primary`, `secondary`, `outline`, `destructive`, `success`, `warning`.

### EmptyState
Visual feedback when no data is available. 
Props: `title`, `description`, `icon`, `action` (flexible ReactNode).

## Usage Guide
When building new pages:
1. Wrap main content in a container (standard padding).
2. Use `<PageHeader />` at the top.
3. Use `<Card />` to group related information.
4. Use `<Table />` for data listings and `<EmptyState />` when empty.
5. Use standard `<Button />`, `<Input />`, `<Select />` for forms.
