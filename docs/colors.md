# Key Color Patterns:

CLI Colors (packages/opencode/src/cli/ui.ts):
- Green: Success/file operations (TEXT_SUCCESS_BOLD)
- Blue: Information/progress (TEXT_INFO_BOLD) 
- Yellow: Warnings/todos (TEXT_WARNING_BOLD)
- Red: Errors/danger (TEXT_DANGER_BOLD)
- Cyan: Important highlights (TEXT_HIGHLIGHT_BOLD)
- Gray: Metadata/time stamps (TEXT_DIM)

Web Interface:
- Muted, professional palette with semantic naming (--color-success, --color-text-secondary)
- High contrast ratios for accessibility
- Dark mode support following prefers-color-scheme

Specialized Applications:
- Diff view: Green for additions, red for removals with +/- text labels
- Connection status: Color-coded dots (green=connected, orange=connecting, red=error)
- OAuth pages: Themed HTML with success/error color schemes

Color Philosophy:
Colors are applied selectively to status indicators, errors, and tool names while keeping regular content plain text. This creates visual hierarchy without overwhelming users, supporting their professional tone through sophisticated, accessible color schemes that provide clear visual cues without being flashy or unprofessional.
