import { useRenderer } from "@opentui/react";
import { useTerminalDimensions } from "@opentui/react";
import { useState, useEffect } from "react";
import { colors, padding } from "../utils/styling";
import { TextAttributes } from "@opentui/core";
import { useApplicationStore } from "../stores/application";
import { SplitBorder } from "../components/border";
import { Clipboard } from "../scripts/clipboard";
import { Toast, useToast } from "../components/ui/toast";

export default function BaseLayout({ children }: { children: React.ReactNode }) {
    const renderer = useRenderer()
    renderer.disableStdoutInterception()
    const { activePane, setActivePane } = useApplicationStore((state) => state);
    const dimensions = useTerminalDimensions();
    const [pwd, setPwd] = useState<string>("");
    const version = "v0.1.11";
    const toast = useToast();

    useEffect(() => {
        Bun.$`pwd`.quiet().then(result => setPwd(result.text()));
        setActivePane("containers");
    }, [setActivePane]);

    return (
        <box 
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor={colors.background}
            onMouseUp={async () => {
                const text = renderer.getSelection()?.getSelectedText()
                if (text && text.length > 0) {
                    const base64 = Buffer.from(text).toString("base64")
                    const osc52 = `\x1b]52;c;${base64}\x07`
                    const finalOsc52 = process.env["TMUX"] ? `\x1bPtmux;\x1b${osc52}\x1b\\` : osc52
                    /* @ts-expect-error */
                    renderer.writeOut(finalOsc52)
                    await Clipboard.copy(text)
                        .then(() => toast.show({ message: "Copied to clipboard", variant: "success" }))
                        .catch(toast.error);
                    renderer.clearSelection()
                }     
           }}
        >
            <box
                flexDirection="row"
                gap={1}
                width="100%"
                height="100%"
                {...padding}
            >
                {children}
            </box>
            <box
                height={1}
                backgroundColor={colors.backgroundPanel}
                flexDirection="row"
                justifyContent="space-between"
                flexShrink={0}
            >
                <box flexDirection="row">
                    <box flexDirection="row" backgroundColor={colors.backgroundElement} paddingLeft={1} paddingRight={1}>
                        <text fg={colors.textMuted}>open</text>
                        <text attributes={TextAttributes.BOLD}>docker </text>
                        <text fg={colors.textMuted}>{version}</text>
                    </box>
                    <box paddingLeft={1} paddingRight={1}>
                        <text fg={colors.textMuted}>~{pwd}</text>
                    </box>
                </box>
                <box flexDirection="row" gap={1}>
                    {/* <text fg={colors.textMuted}>tab</text> */}
                    <box backgroundColor={colors.secondary} paddingLeft={1} paddingRight={1} {...SplitBorder} borderColor={colors.backgroundPanel}>
                        <text fg={colors.backgroundPanel} attributes={TextAttributes.BOLD}>{activePane}</text>
                    </box>
                </box>
            </box>
            <Toast />
        </box>
    )
}
