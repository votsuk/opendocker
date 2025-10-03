import { useRenderer, render, useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useState, useEffect } from "react";
import ContainersPane from "./components/ContainersPane";
import LogsPane from "./components/LogsPane";
import { colors } from "./utils/styling";
import { TextAttributes } from "@opentui/core";
import ImagesPane from "./components/ImagesPane";
import VolumesPane from "./components/VolumesPanes";

function App() {
    const dimensions = useTerminalDimensions();
    const renderer = useRenderer();

    const [pwd, setPwd] = useState<string>("");
    useEffect(() => {
        Bun.$`pwd`.quiet().then(result => setPwd(result.text()));
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
                flexGrow={1}
                gap={2}
                paddingLeft={2}
                paddingRight={2}
                paddingTop={1}
                paddingBottom={1}
            >
                <box
                    flexDirection="column"
                    width="50%"
                    gap={1}
                >
                    <ContainersPane />
                    <ImagesPane />
                    <VolumesPane />
                </box>
                <LogsPane activeService={null} />
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
            </box>
        </box>
    )
}

render (<App />);
