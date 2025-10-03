import { useState, useEffect } from "react";
import { useKeyboard } from "@opentui/react";
import { colors } from "../utils/styling";
import Pane from "./Pane";
import { useContainerStore } from "../stores/containers";

export default function ContainersPane() {
    const { containers, setContainers, activeContainer, setActiveContainer } = useContainerStore((state) => state);
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        const process = Bun.spawn(
            ["docker", "ps", "-a", "--format", "{{.Names}}:{{.Status}}"],
            {stdout: "pipe", stderr: "pipe"}
        );

        async function read() {
            try {
                const reader = process.stdout.getReader();
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const decodedValues = new TextDecoder().decode(value);
                    const lines = decodedValues.split("\n").filter(Boolean);
                    const objs = lines.map((contaienr) => {
                        const [name, status] = contaienr.split(":");
                        return { name, status };
                    });
                    setContainers(objs);

                    if (!activeContainer) {
                        setActiveContainer(objs[0]);
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }

        read();

        return () => process.kill();
    }, []);

    useKeyboard((key) => {
        if (key.name === 'j' || key.name === 'down') {
            const index = Math.min(selectedIndex + 1, containers.length - 1);
            setSelectedIndex(index);
            setActiveContainer(containers[index]);
        }

         if (key.name === 'k' || key.name === 'up') {
            const index = Math.max(selectedIndex - 1, 0);
            setActiveContainer(containers[index]);
            setSelectedIndex(index);
        }
    });

    return (
        <Pane
            title="Containers"
            flexDirection="column"
            width="100%"
            active={true}
        >
            {containers.map((item, index) => {
                function getStatusColor() {
                    if (activeContainer.name === item.name) {
                        return colors.backgroundPanel;
                    }

                    if (item.status.startsWith("Up")) {
                        return colors.success;
                    }

                    if (item.status.startsWith("Exited")) {
                        return colors.error;
                    }
                }

                return (
                    <box
                        backgroundColor={index === selectedIndex ? colors.primary : undefined}
                        flexDirection="row"
                        justifyContent="space-between"
                    >
                        <text
                            key={index}
                            content={item.name}
                            fg={index === selectedIndex ? colors.backgroundPanel : colors.textMuted}
                        />
                        <text
                            key={index}
                            content={item.status.startsWith("Up") ? "Running" : "Exited"}
                            fg={getStatusColor()}
                        />
                    </box>
                )
            })}
            {containers.length < 1 && <text fg={colors.textMuted}>No Containers</text>}
        </Pane>
    )
}
