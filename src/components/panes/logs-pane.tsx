import application from '@/stores/application';
import { Pane } from '@/ui/pane';
import { colors } from '@/util/colors';
import { TextAttributes } from '@opentui/core';

export default function LogsPane() {
    const { store, setStore } = application;

    return (
        <Pane title="Logs" width="70%" height="100%">
            <box paddingLeft={1} paddingRight={1}>
                <box flexDirection="row" gap={2}>
                    <box>
                        <text fg={colors.textMuted} attributes={TextAttributes.BOLD}>Container</text>
                        <text fg={colors.text}>{store.activeContainer}</text>
                    </box>
                    <box>
                        <text fg={colors.textMuted} attributes={TextAttributes.BOLD}>Status</text>
                        <text fg={colors.text}>{store.activeContainer}</text>
                    </box>
                </box>
            </box>
        </Pane>
    )
}
