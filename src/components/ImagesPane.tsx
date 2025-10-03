import { useEffect } from "react";
import Pane from "./Pane";
import { colors } from "../utils/styling";
import { useImageStore } from "../stores/images";

export default function ImagesPane() {
    const { images, setImages } = useImageStore();

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

    return (
        <Pane
            title="Images"
            active={false}
            flexShrink={1}
        >
            {images.map((item, index) => {
                return <box>
                    <text
                        key={index}
                        content={item}
                        fg={colors.textMuted}
                    />
                </box>
            })}
            {images.length < 1 && <text fg={colors.textMuted}>No Images</text>}
        </Pane>
    )
}
