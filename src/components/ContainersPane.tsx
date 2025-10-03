 import { useState, useEffect, useRef } from "react";
import { useKeyboard } from "@opentui/react";
import { colors } from "../utils/styling";
import Pane from "./Pane";
import { useContainerStore } from "../stores/containers";
import { useApplicationStore } from "../stores/application";
import type { ScrollBoxRenderable } from "@opentui/core";

export default function ContainersPane() {
    const { activePane, setActivePane } = useApplicationStore((state) => state);
    const { containers, setContainers, activeContainer, setActiveContainer } = useContainerStore((state) => state);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const active = activePane === "Containers";
    const scrollBoxRef = useRef<ScrollBoxRenderable>(null);

    useEffect(() => {
        const process = Bun.spawn(
            ["docker", "ps", "-a", "--format", "{{.Names}}"],
            {stdout: "pipe", stderr: "pipe"}
        );

        async function read() {
            try {
                const output = await new Response(process.stdout).text();
                const lines = output.split("\n").filter(Boolean);
                const objs = lines.map((container) => {
                    return { name: container };
                });

                // Enrich with health status
                const enriched = await Promise.all(objs.map(async (container) => {
                    const inspectProcess = Bun.spawn(
                        ["docker", "inspect", container.name, "--format", "{{.State.Status}}:{{if .State.Health}}{{.State.Health.Status}}{{end}}"],
                        {stdout: "pipe", stderr: "pipe"}
                    );

                    try {
                        const output = await new Response(inspectProcess.stdout).text();
                        const [status, healthOutput] = output.split(":");
                        const health = healthOutput.trim() || "";
                        return { ...container, status: status, health: health };
                    } catch (error) {
                        return { ...container, status: undefined, health: undefined };
                    } finally {
                        inspectProcess.kill();
                    }
                }));

                setContainers(enriched);

                if (!active) {
                    return;
                }

                if (!activeContainer && enriched.length > 0) {
                    setActiveContainer(enriched[0]);
                }
            } catch (error) {
                console.error(error);
            }
        }

        read();

        return () => {
            process.kill();
        }
    }, [active]);

    useKeyboard((key) => {
        if (!active) {
            return;
        }

        if (key.name === "left") {
            setActivePane("Volumes");
        }

        if (key.name === "right" || key.name === "tab") {
            setActivePane("Images");
        }

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
            active={active}
        >
            <scrollbox
                ref={scrollBoxRef}
                scrollY={true}
                stickyScroll={true}
                stickyStart="bottom"
                viewportOptions={{
                    flexGrow: 1
                }}
                marginTop={1}
            >
                {containers.map((item, index) => {
                    function getStatusColor() {
                        if (activeContainer?.name === item.name) {
                            return colors.backgroundPanel;
                        }

                        if (item?.status === "running") {

                            if (item.health && item.health !== "healthy") {
                                return colors.warning;
                            }
                            return colors.success;
                        }

                        if (item?.status === "exited") {
                            return colors.error;
                        }

                        return colors.secondary;
                    }

                    return (
                        <box
                            backgroundColor={activeContainer?.name === item.name ? colors.primary : undefined}
                            flexDirection="row"
                            justifyContent="space-between"
                        >
                            <text
                                key={index}
                                content={item.name}
                                fg={activeContainer?.name === item.name ? colors.backgroundPanel : colors.textMuted}
                                wrap={true}
                            />
                            <text
                                key={index}
                                content={item.status}
                                fg={getStatusColor()}
                            />
                        </box>
                    )
                })}
                {containers.length < 1 && <text fg={colors.textMuted}>No Containers</text>}
            </scrollbox>
        </Pane>
    )
}
