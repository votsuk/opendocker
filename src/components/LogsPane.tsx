import { useState, useEffect, useRef, useMemo } from "react";
import { colors, termColors } from "../utils/styling";
import { RGBA, TextAttributes, type ScrollBoxRenderable } from "@opentui/core";
import Pane from "./Pane";
import { useContainerStore } from "../stores/containers";
import { useApplicationStore } from "../stores/application";
import { Shimmer } from "./ui/Shimmer";

type LogEntry = {
    text: string;
    type: 'stdout' | 'stderr';
};

export default function LogsPane() {
    const { activePane } = useApplicationStore((state) => state);
    const { activeContainer } = useContainerStore((state) => state);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const scrollBoxRef = useRef<ScrollBoxRenderable>(null);

    useEffect(() => {
        if (!activeContainer || activePane !== "containers") {
            cleanup();
            return;
        };

        const process = Bun.spawn([
            "docker",
            "logs",
            "--follow",
            "--tail",
            "100",
            activeContainer.name,
        ], {
            stdout: "pipe",
            stderr: "pipe",
        });

        async function readStream(stream: ReadableStream, type: 'stdout' | 'stderr') {
            const decoder = new TextDecoder();
            const reader = stream.getReader();

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const text = decoder.decode(value, { stream: true });
                    // Split by newlines and filter out empty lines
                    const lines = text.split('\n').filter(line => line.trim().length > 0);
                     
                     if (lines.length > 0) {
                        setLogs(prev => {
                            const newEntries = lines.map(line => ({
                                text: line,
                                type
                            }));
                            return [...prev, ...newEntries];
                        });
                    }
                }
            } catch (error) {}
        }

        readStream(process.stdout, 'stdout');
        readStream(process.stderr, 'stderr');

        return () => {
            process.kill();
            cleanup();
        }
    }, [activePane, activeContainer?.name, activeContainer?.state])

    useEffect(() => {
        if (scrollBoxRef.current && logs.length > 0) {
            scrollBoxRef.current.scrollTo({ x: 0, y: scrollBoxRef.current.scrollHeight });
        }
    }, [logs]);

    function cleanup() {
        setLogs([]);
    }

    const output = useMemo(() => {
        if (logs.length === 0 && activeContainer?.state === "created") {
            return <Shimmer text="Container starting..." color={RGBA.fromHex(colors.text)} />
        }

        if (logs.length === 0) {
            return <text fg={colors.textMuted}>No logs available</text>;
        }

        return logs.map((log, index) => (
            <text
                key={index}
            >
                {log.text}
            </text>
        ));
    }, [logs]);

    return (
        <Pane
            title="Logs"
            flexDirection="column"
            width="70%"
        >
            <box flexDirection="column" gap={1} height="100%">
                <box flexDirection="row" gap={2} height="auto">
                    <box flexDirection="column" gap={1}>
                        <text fg={termColors.purple11} attributes={TextAttributes.BOLD}>Container</text>
                        <text>{activeContainer?.name || "None"}</text>
                    </box>
                    <box flexDirection="column">
                        <text fg={termColors.purple11} attributes={TextAttributes.BOLD}>Status</text>
                        <text>{activeContainer?.status || "None"}</text>
                    </box>
                </box>
                <scrollbox
                    ref={scrollBoxRef}
                    scrollY={true}
                    stickyScroll={true}
                    stickyStart="bottom"
                    height="100%"
                >
                    <box flexDirection="column" height="auto">
                        {output}
                    </box>
                </scrollbox>
            </box>
        </Pane>
    )
}
