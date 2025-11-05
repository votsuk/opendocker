import { useState, useEffect, useRef } from "react";
import { useKeyboard } from "@opentui/react";
import { colors, termColors } from "../utils/styling";
import Pane from "./Pane";
import { useContainerStore } from "../stores/containers";
import { useApplicationStore } from "../stores/application";
import type { ScrollBoxRenderable } from "@opentui/core";
import { Docker } from "../lib/docker";
import { TextAttributes } from "@opentui/core";

export default function ContainersPane() {
    const { activePane, setActivePane } = useApplicationStore((state) => state);
    const { containers, setContainers, activeContainer, setActiveContainer } = useContainerStore((state) => state);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const paneActive = activePane === "containers";
    const scrollBoxRef = useRef<ScrollBoxRenderable>(null);

    useEffect(() => {
        if (!paneActive) return;
        
        const docker = new Docker();

        docker.watch((dockerContainers) => {
            console.log(dockerContainers[0]);
            const transformed = dockerContainers.map(container => ({
                name: container.Names[0].replace("/", ""),
                status: container.Status,
                state: container.State,
                health: container.Health,
            }));

            setContainers(transformed);

            // Get the CURRENT active container from store, not from stale closure
            const currentActive = useContainerStore.getState().activeContainer;
            
            if (currentActive) {
                const stillExists = transformed.find((c) => c.name === currentActive.name);
                if (stillExists) {
                    return;
                }
            }

            if (transformed.length > 0) {
                setActiveContainer(transformed[0]);
            }
        });
    }, [paneActive]);

    useKeyboard((key) => {
        if (!paneActive) {
            return;
        }

        if (key.name === "left") {
            setActivePane("volumes");
        }

        if (key.name === "right" || key.name === "tab") {
            setActivePane("images");
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
            active={paneActive}
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
                {containers.map((item, index) => {
                    function getStateColor() {
                        if (paneActive && activeContainer?.name === item.name) {
                            return colors.backgroundPanel;
                        }

                        if (item?.state === "running") {
                            if (item.status.includes("starting")) {
                                return termColors.orange11;
                            }

                            if (item.status.includes("unhealthy")) {
                                return termColors.red11;
                            }

                            return termColors.green11;
                        }

                        if (item?.state === "exited") {
                            return termColors.red11;
                        }

                        return termColors.blue11;
                    }

                    return (
                        <box
                            key={index}
                            backgroundColor={paneActive && activeContainer?.name === item.name ? colors.primary : undefined}
                            flexDirection="row"
                            justifyContent="space-between"
                            paddingLeft={1}
                            paddingRight={1}
                        >
                            <text
                                content={item.name}
                                fg={paneActive && activeContainer?.name === item.name ? colors.backgroundPanel : colors.textMuted}
                                attributes={paneActive && activeContainer?.name === item.name && TextAttributes.BOLD}
                            />
                            <text
                                content={item.state}
                                fg={getStateColor()}
                            />
                        </box>
                    )
                })}
                {containers.length < 1 && <text fg={colors.textMuted}>No Containers</text>}
            </scrollbox>
        </Pane>
    )
}
