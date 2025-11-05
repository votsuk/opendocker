#!/usr/bin/env bun

import { useRenderer, render, useKeyboard } from "@opentui/react";
import ContainersPane from "./components/ContainersPane";
import LogsPane from "./components/LogsPane";
import ImagesPane from "./components/ImagesPane";
import VolumesPane from "./components/VolumesPanes";
import BaseLayout from "./layouts/BaseLayout";

function App() {
    const renderer = useRenderer();

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
        <BaseLayout>
            <box
                flexDirection="column"
                width="30%"
                gap={1}
            >
                <ContainersPane />
                <ImagesPane />
                <VolumesPane />
            </box>
            <LogsPane />
        </BaseLayout>
    )
}

render (<App />);
