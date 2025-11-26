import { useState, useEffect, useRef, useMemo } from "react";
import { colors } from "../utils/styling";
import { RGBA, TextAttributes, type ScrollBoxRenderable } from "@opentui/core";
import Pane from "./pane";
import { useContainerStore } from "../stores/containers";
import { useApplicationStore } from "../stores/application";
import { Shimmer } from "./ui/shimmer";
import stripAnsi from "strip-ansi";
import { useKeyboard } from "@opentui/react";

const MAX_CHARS = 10000;

export default function LogsPane() {
    const { activePane } = useApplicationStore((state) => state);
    const { activeContainer } = useContainerStore((state) => state);
    const [logs, setLogs] = useState<string>("");
    const scroll = useRef<ScrollBoxRenderable>(null);
    const [filter, setFilter] = useState("");

    useKeyboard((key) => {
        if (key.name === 'pagedown') {
            scroll.current?.scrollTo(scroll.current.scrollHeight);
            return;
        }
    });

    useEffect(() => {
        if (!activeContainer || activePane !== "containers") {
            cleanup();
            return;
        };

        const shellCommand = filter.trim()
            ? `docker logs --follow --tail 100 ${activeContainer.name} | grep -i "${filter}"`
            : `docker logs --follow --tail 100 ${activeContainer.name}`;

        const process = Bun.spawn([
            "bash",
            "-c",
            shellCommand,
        ], {
            stdout: "pipe",
            stderr: "pipe",
        });

        async function readStream(stream: ReadableStream) {
            const decoder = new TextDecoder();
            const reader = stream.getReader();

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const text = decoder.decode(value, { stream: true });
                    const cleanText = stripAnsi(text);
                     
                     if (cleanText.length > 0) {
                        setLogs(prev => {
                            const updated = prev + cleanText;
                            return updated;
                            return updated.length > MAX_CHARS ? updated.slice(-MAX_CHARS) : updated;
                        });
                    }
                }
            } catch (error) {}
        }

        readStream(process.stdout);
        readStream(process.stderr);

        return () => {
            process.kill();
            cleanup();
        }
    }, [activePane, activeContainer?.name, activeContainer?.state, filter])

    function cleanup() {
        setLogs("");
    }

    const output = useMemo(() => {
        if (logs.length === 0 && activeContainer?.state === "created") {
            return <Shimmer text="Container starting..." color={RGBA.fromHex(colors.text)} />
        }

        if (logs.length === 0) {
            return <text fg={colors.textMuted}>No logs available</text>;
        }

        return <text fg={colors.textMuted}>{logs}</text>
    }, [logs]);

    return (
        <box flexDirection="column" gap={1} height="100%" width="70%">
            <Pane
                title="Logs"
                flexDirection="column"
                height="auto"
            >
                <box flexDirection="column" gap={1} height="100%">
                    <box flexDirection="row" justifyContent="space-between">
                        <box flexDirection="row" gap={2} height="auto">
                            <box flexDirection="column" gap={1}>
                                <text fg={colors.secondary} attributes={TextAttributes.BOLD}>Container</text>
                                <text fg={activeContainer?.name ? colors.text : colors.textMuted}>{activeContainer?.name || "None"}</text>
                            </box>
                            <box flexDirection="column">
                                <text fg={colors.secondary} attributes={TextAttributes.BOLD}>Status</text>
                                <text fg={activeContainer?.status ? colors.text : colors.textMuted}>{activeContainer?.status || "None"}</text>
                            </box>
                        </box>
                        <box flexDirection="row" gap={2} height="auto">
                            <box flexDirection="row" gap={1}>
                                <text fg={colors.text}>[Pg Dn]</text>
                                <text fg={colors.textMuted}>Scroll to bottom</text>
                            </box>
                        </box>
                    </box>
                    <scrollbox
                        ref={scroll}
                        scrollY={true}
                        stickyScroll={true}
                        stickyStart="bottom"
                        height="100%"
                    >
                        <box flexDirection="column" height="auto" paddingRight={1}>
                            {output}
                        </box>
                    </scrollbox>
                </box>
            </Pane>
        </box>
    )
}
