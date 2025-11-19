#!/usr/bin/env bun

import { createRoot, useKeyboard, useRenderer } from "@opentui/react";
import { createCliRenderer } from "@opentui/core";
import ContainersPane from "./components/ContainersPane";
import LogsPane from "./components/LogsPane";
import BaseLayout from "./layouts/BaseLayout";

function App() {
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

    return (
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
    )
}

async function main() {
    const renderer = await createCliRenderer();
  const root = createRoot(renderer);
  root.render(<App />);
}

main();
