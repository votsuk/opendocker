import { useEffect, useRef } from "react";
import { useKeyboard } from "@opentui/react";
import Pane from "./Pane";
import { colors } from "../utils/styling";
import { useImageStore } from "../stores/images";
import { useApplicationStore } from "../stores/application";
import type { ScrollBoxRenderable } from "@opentui/core";

export default function ImagesPane() {
    const { activePane, setActivePane } = useApplicationStore((state) => state);
    const { images, setImages } = useImageStore();
    const scrollBoxRef = useRef<ScrollBoxRenderable>(null);

    useEffect(() => {
        const process = Bun.spawn(
            ["docker", "images", "--format", "{{.Repository}}"],
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
                    setImages(lines);
                }
            } catch (error) {
                console.error(error);
            }
        }

        read();

        return () => process.kill();
    }, []);

    useKeyboard((key) => {
        if (activePane !== "Images") {
            return;
        }

        if (key.name === "left") {
            setActivePane("Containers");
        }

        if (key.name === "right" || key.name === "tab") {
            setActivePane("Volumes");
        }
    });

    return (
        <Pane
            title="Images"
            width="100%"
            active={activePane === "Images"}
            flexDirection="column"
        >
            <scrollbox
                ref={scrollBoxRef}
                scrollY={true}
                stickyScroll={true}
                stickyStart="top"
            >
                {images.map((item: string, index: number) => {
                    return (
                        <box> 
                            <text
                                key={index}
                                content={item}
                                fg={colors.textMuted}
                            />
                        </box>
                     )
                })}
                {images.length < 1 && <text fg={colors.textMuted}>No Images</text>}
            </scrollbox>
        </Pane>
    )
}
