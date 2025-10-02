import { useRenderer, render, useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useState } from "react";
import DockerSerivcesBox from "./components/DockerServicesBox";
import DockerServiceLogsBox from "./components/DockerServiceLogsBox";
import { colors } from "./utils/colors";
import { TextAttributes } from "@opentui/core";

function App() {
    const dimensions = useTerminalDimensions();
    const renderer = useRenderer();
    const [activeService, setActiveService] = useState<string | null>(null);

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
                <DockerSerivcesBox activeService={activeService} setActiveService={setActiveService} />
                <DockerServiceLogsBox activeService={activeService} />
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
                        {/* <text fg={colors.textMuted}>{process.cwd().replace(Global.Path.home, "~")}</text> */}
                    </box>
                </box>
            </box>
        </box>
    )
}

render (<App />);
