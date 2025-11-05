
import { useTerminalDimensions } from "@opentui/react";
import { useState, useEffect } from "react";
import { colors, padding } from "../utils/styling";
import { TextAttributes } from "@opentui/core";
import { useApplicationStore } from "../stores/application";
import { SplitBorder } from "../components/Border";

export default function BaseLayout({ children }: { children: React.ReactNode }) {
    const { activePane, setActivePane } = useApplicationStore((state) => state);
    const dimensions = useTerminalDimensions();
    const [pwd, setPwd] = useState<string>("");

    useEffect(() => {
        Bun.$`pwd`.quiet().then(result => setPwd(result.text()));
        setActivePane("containers");
        
    }, [setActivePane]);

    return (
        <box 
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor={colors.background}
        >
            <box
                flexDirection="row"
                gap={1}
                width="100%"
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
                        <text fg={colors.textMuted}>alpha</text>
                    </box>
                    <box paddingLeft={1} paddingRight={1}>
                        <text fg={colors.textMuted}>~{pwd}</text>
                    </box>
                </box>
                <box flexDirection="row" gap={1}>
                    <text fg={colors.textMuted}>tab</text>
                    <box backgroundColor={colors.accent} paddingLeft={1} paddingRight={1} {...SplitBorder} borderColor={colors.backgroundPanel}>
                        <text fg={colors.backgroundPanel} attributes={TextAttributes.BOLD}>{activePane}</text>
                    </box>
                </box>
            </box>
        </box>
    )
}
