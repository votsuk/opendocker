import { useState, useEffect, useRef } from "react";
import { colors } from "../utils/styling";
import type { ScrollBoxRenderable } from "@opentui/core";
import Pane from "./Pane";
import { useContainerStore } from "../stores/containers";
import { useApplicationStore } from "../stores/application";

export default function LogsPane() {
    const { activePane } = useApplicationStore((state) => state);
    const { activeContainer } = useContainerStore((state) => state);
    const [logs, setLogs] = useState<string>("");
    const scrollBoxRef = useRef<ScrollBoxRenderable>(null);
    const [state, setState] = useState("idle");

    useEffect(() => {
        // This causes the application to crash currently.
        // TODO: Fix this.
        // if (activePane === "containers") {
        //     cleanup();
        //     return;
        // };
        
        setState("loading");
        setLogs("");
        const process = Bun.spawn(["docker", "logs", "--follow", activeContainer.name], {
            stdout: "pipe",
            stderr: "pipe",
        });

        async function read() {
            try {
                const reader = process.stdout.getReader();
                setState("success");
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    setLogs(prev => prev + new TextDecoder().decode(value));
                }
            } catch (error) {
                setState("error");
            }
        }

        read();

        return () => process.kill();
    }, [activeContainer]);

    useEffect(() => {
        if (scrollBoxRef.current && logs) {
            scrollBoxRef.current.scrollTo({ x: 0, y: scrollBoxRef.current.scrollHeight });
        }
    }, [logs]);

    function cleanup() {
        setState("idle");
        setLogs("");
    }

    const title = `Logs | ${activeContainer?.name} | ${activeContainer?.status}`;

    return (
        <Pane
            title={title}
            flexDirection="column"
            width="70%"
        >
            <scrollbox
                ref={scrollBoxRef}
                scrollY={true}
                stickyScroll={true}
                stickyStart="bottom"
                viewportOptions={{
                    flexGrow: 1
                }}
                contentOptions={{
                    flexDirection: "column",
                    gap: 1
                }}
                marginTop={1}
            >
                {state === "loading" && <text fg={colors.textMuted}>Loading...</text>}
                {state === "error" && <text fg={colors.textMuted}>Error fetching logs</text>}
                {state === "success" && <text fg={colors.textMuted} wrap={true}>{logs || "No logs available"}</text>}
                {state === "idle" && <text fg={colors.textMuted}>No logs available</text>}
            </scrollbox>
        </Pane>
    )
}
