#!/usr/bin/env bun

import { createRoot, useKeyboard, useRenderer } from "@opentui/react";
import { createCliRenderer } from "@opentui/core";
import ContainersPane from "./components/containers-pane";
import LogsPane from "./components/logs-pane";
import BaseLayout from "./layouts/base-layout";
import { ToastProvider } from "./components/ui/toast";
import { useApplicationStore } from "./stores/application";
import { colors, padding } from "./utils/styling";
import { SplitBorder } from "./components/border";
import { TextAttributes } from "@opentui/core";

function App() {
    const { systemError } = useApplicationStore((state) => state);
    const renderer = useRenderer();

    useKeyboard((key) => {
        if (key.name === "q") {
            process.exit(0);
        }

        if (key.ctrl && key.name === "d") {
            renderer?.console.toggle()
            renderer?.toggleDebugOverlay()
        }
    })

    if (systemError) {
        return (
            <ToastProvider>
                <BaseLayout>
                    <box height="100%" width="100%" flexDirection="column" alignItems="center" justifyContent="center">
                        <box
                            {...SplitBorder}
                            borderColor={colors.error}
                        >
                            <box
                                backgroundColor={colors.backgroundPanel}
                                {...padding}
                            >
                                <text fg={colors.text} attributes={TextAttributes.BOLD}>{systemError.message}</text>
                                <text fg={colors.textMuted}>Is docker running?</text>
                            </box>
                        </box>
                    </box>
                </BaseLayout>
            </ToastProvider>
        )
    }

    return (
        <ToastProvider>
            <BaseLayout>
                <box
                    flexDirection="column"
                    width="30%"
                    gap={1}
                >
                    <ContainersPane />
                </box>
                <LogsPane />
            </BaseLayout>
        </ToastProvider>
    )
}

async function main() {
  const renderer = await createCliRenderer();
  const root = createRoot(renderer);
  root.render(<App />);
}

main();
