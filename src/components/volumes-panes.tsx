 import { useEffect, useRef } from "react";
import { useKeyboard } from "@opentui/react";
import Pane from "./pane";
import { colors } from "../utils/styling";
import { useVolumeStore } from "../stores/volumes";
import { useApplicationStore } from "../stores/application";
import type { ScrollBoxRenderable } from "@opentui/core";

export default function ImagesPane() {
    const { activePane, setActivePane } = useApplicationStore((state) => state);
    const { volumes, setVolumes } = useVolumeStore();
    const scrollBoxRef = useRef<ScrollBoxRenderable>(null);

    useEffect(() => {
        const process = Bun.spawn(
            ["docker", "volume", "ls", "--format", "{{.Name}}"],
            {stdout: "pipe", stderr: "pipe"},
        );

        async function read() {
            try {
                const reader = process.stdout.getReader();
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const decodedValues = new TextDecoder().decode(value);
                    const lines = decodedValues.split("\n").filter(Boolean);
                    setVolumes(lines);
                }
            } catch (error) {
                console.error(error);
            }
        }

        read();

        return () => process.kill();
    }, []);

    useKeyboard((key) => {
        if (activePane !== "volumes") {
            return;
        }

        if (key.name === "left") {
            setActivePane("images");
        }

        if (key.name === "right" || key.name === "tab") {
            setActivePane("containers");
        }
    });

    return (
        <Pane
            title="Volumes"
            active={activePane === "volumes"}
            width="100%"
            flexDirection="column"
        >
            <scrollbox
                ref={scrollBoxRef}
                scrollY={true}
                stickyScroll={true}
                stickyStart="bottom"
                viewportOptions={{
                    flexGrow: 1
                }}
            >
                {volumes.map((item, index) => {
                    return <box>
                        <text
                            key={index}
                            content={`[*] ${item}`}
                            fg={colors.textMuted}
                        />
                    </box>
                })}
                {volumes.length < 1 && <text fg={colors.textMuted}>No Volumes</text>}
            </scrollbox>
        </Pane>
    )
}
