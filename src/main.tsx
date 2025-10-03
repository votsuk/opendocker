import { useRenderer, render, useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useState, useEffect } from "react";
import ContainersPane from "./components/ContainersPane";
import LogsPane from "./components/LogsPane";
import { colors, padding } from "./utils/styling";
import { TextAttributes } from "@opentui/core";
import ImagesPane from "./components/ImagesPane";
import VolumesPane from "./components/VolumesPanes";
import { useApplicationStore } from "./stores/application";
import { SplitBorder } from "./components/Border";

function App() {
    const { activePane, setActivePane } = useApplicationStore((state) => state);
    const dimensions = useTerminalDimensions();
    const renderer = useRenderer();
    const [pwd, setPwd] = useState<string>("");

    useEffect(() => {
        Bun.$`pwd`.quiet().then(result => setPwd(result.text()));
        setActivePane("Containers");
    }, []);

    useKeyboard((key) => {
        if (key.name === "q") {
            process.exit(0);
        }

        if (key.ctrl && key.name === "k") {
            renderer?.console.toggle()
            renderer?.toggleDebugOverlay()
        }
    })


    return (
        <box 
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor={colors.background}
        >
            <box
                flexDirection="row"
                gap={2}
                width="100%"
                {...padding}
            >
                <box
                    flexDirection="column"
                    width="30%"
                    gap={1}
                >
                    <ContainersPane flexGrow={1} />
                    <ImagesPane flexGrow={1} />
                    <VolumesPane flexGrow={1} />
                </box>
                <LogsPane />
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

render (<App />);
