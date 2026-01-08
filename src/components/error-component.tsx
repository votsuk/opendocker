import { TextAttributes } from '@opentui/core';
import { colors } from '@/util/colors';

interface ErrorComponentProps {
    error: Error;
}

export function ErrorComponent(props: ErrorComponentProps) {
    return (
        <box flexDirection="column" gap={2}>
            <box>
                <text attributes={TextAttributes.BOLD} fg={colors.warning}>
                    There's been a woopsie!
                </text>
                <text fg={colors.textMuted}>
                    If this problem persists, please reach out to me on X @swe_steeve
                </text>
            </box>
            <box flexDirection="column" gap={1}>
                <box>
                    <text fg={colors.error} attributes={TextAttributes.BOLD}>
                        Error message:
                    </text>
                    <text fg={colors.textMuted}>{props.error.message}</text>
                </box>
                <box>
                    <text fg={colors.error} attributes={TextAttributes.BOLD}>
                        Stack trace:
                    </text>
                    <text fg={colors.textMuted}>{props.error.stack}</text>
                </box>
            </box>
        </box>
    );
}
