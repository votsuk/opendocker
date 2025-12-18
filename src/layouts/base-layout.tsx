import { createSignal, onMount } from "solid-js";
import type { JSX } from "solid-js";
import { TextAttributes } from "@opentui/core";
import { colors } from "@/util/colors";
import { SplitBorder } from "@/components/border";
import { Toast } from "@/ui/toast";

export function BaseLayout({ children }: { children: JSX.Element }) {
    const [pwd, setPwd] = createSignal("");

    onMount(() => {
        Bun.$`pwd`.quiet().then(result => setPwd(`~${result.text().trim()}`));
    });

    return (
        <>
            <Toast />
            <box
                width="100%"
                height="100%"
                backgroundColor={colors.background}
            >
                <box height="100%" width="100%" padding={1}>
                    {children}
                </box>
                <box
                    width="100%"
                    height="auto"
                    flexDirection="row"
                    justifyContent="space-between"
                    backgroundColor={colors.backgroundPanel}
                >
                    <box flexDirection="row" gap={1}>
                        <box
                            flexDirection="row"
                            gap={1}
                            backgroundColor={colors.backgroundElement}
                            paddingLeft={1}
                            paddingRight={1}
                        >
                            <box flexDirection="row">
                                <text fg={colors.textMuted} attributes={TextAttributes.BOLD}>open</text>
                                <text fg={colors.text} attributes={TextAttributes.BOLD}>docker</text>
                            </box>
                            <text fg={colors.textMuted}>vlocal</text>
                        </box>
                        <box>
                            <text fg={colors.textMuted}>{pwd()}</text>
                        </box>
                    </box>
                    <box>
                        <box backgroundColor={colors.secondary} paddingLeft={1} paddingRight={1} {...SplitBorder} borderColor={colors.backgroundPanel}>
                            <text fg={colors.backgroundPanel} attributes={TextAttributes.BOLD}>containers</text>
                        </box>
                    </box>
                </box>
            </box>
        </>
    )
}
