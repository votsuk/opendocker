# Agent Development Guide

## Commands
- **Run**: `bun run src/main.tsx`
- **Dev**: `bun --watch run src/main.tsx`
- **Test**: `bun test` (uses `bun:test` imports)
- **Install**: `bun install`

## Code Style
- **Framework**: React with @opentui/react for terminal UI
- **Imports**: Use path aliases `@/*` for src/ and `@tui/*` for src/cli/cmd/tui/
- **Components**: Default exports, PascalCase naming
- **Keyboard**: Vim-style navigation (j/k for up/down, q to quit)
- **Colors**: Use centralized colors from `src/utils/colors.ts`
- **Error Handling**: Try-catch with state-based error handling
- **Shell Commands**: Use `Bun.$` for shell execution

## Key Patterns
- Use `useKeyboard()` hook for terminal input handling
- Components use flexbox layout with terminal dimensions
- State management with React hooks (useState, useEffect)
- Terminal UI elements: `<box>`, `<text>` with styling props