import { useEffect } from "react";
import Pane from "./Pane";
import { colors } from "../utils/styling";
import { useVolumeStore } from "../stores/volumes";

export default function ImagesPane() {
    const { volumes, setVolumes } = useVolumeStore();

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

    return (
        <Pane
            title="Volumes"
            active={false}
            flexShrink={0}
        >
            {volumes.map((item, index) => {
                return <box>
                    <text
                        key={index}
                        content={item}
                        fg={colors.textMuted}
                    />
                </box>
            })}
            {volumes.length < 1 && <text fg={colors.textMuted}>No Volumes</text>}
        </Pane>
    )
}
