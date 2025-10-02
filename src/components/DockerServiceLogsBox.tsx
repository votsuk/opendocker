import { useState, useEffect, useRef } from "react";
import { colors } from "../utils/colors";
import { SplitBorder } from "./Border";
import type { ScrollBoxRenderable } from "@opentui/core";

export default function DockerServiceLogs({ activeService }: { activeService: string | null }) {
    const [logs, setLogs] = useState<string>("");
    const scrollBoxRef = useRef<ScrollBoxRenderable>(null);

    useEffect(() => {
        if (!activeService) {
            setLogs("");
            return;
        }
        async function fetchLogs() {
            try {
                const result = await Bun.$`docker logs ${activeService}`.nothrow().quiet();
                setLogs(result.stdout.toString());
            } catch (error) {
                setLogs("Error fetching logs");
            }
        }
        fetchLogs();
    }, [activeService]);

    useEffect(() => {
        if (scrollBoxRef.current && logs) {
            scrollBoxRef.current.scrollTo({ x: 0, y: scrollBoxRef.current.scrollHeight });
        }
    }, [logs]);

    return (
        <box
            {...SplitBorder}
            flexDirection="column"
            width="50%"
        >
            <box
                flexDirection="column"
                flexGrow={1}
                backgroundColor={colors.backgroundPanel}
                gap={2}
                paddingLeft={2}
                paddingRight={2}
                paddingTop={1}
                paddingBottom={1}
            >
                <text fg={colors.primary}>Logs</text>
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
                >
                    <text fg={colors.textMuted}>{logs || "No logs available"}</text>
                </scrollbox>
            </box>
        </box>
    )
}
