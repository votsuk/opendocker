import { createEffect, createSignal, onCleanup, Switch, Match } from 'solid-js';
import { ScrollBoxRenderable, TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/solid';
import type { Container } from '@/stores/application';
import application from '@/stores/application';
import { Pane } from '@/ui/pane';
import { colors, getColorForContainerState } from '@/util/colors';
import { stripANSI } from 'bun';
import { SyntaxStyle } from '@opentui/core';

export default function LogsPane() {
    const { store } = application;
    const [selected, setSelected] = createSignal<Container>();
    const [logs, setLogs] = createSignal<string>('');
    const [tempLogs, setTempLogs] = createSignal<string>('');
    const [paused, setPaused] = createSignal<boolean>(false);
    const [scroll, setScroll] = createSignal<ScrollBoxRenderable>();
    const logSyntaxStyle = SyntaxStyle.create();
    const [width, setWidth] = createSignal<number>(0);

    useKeyboard(key => {
        if (key.name === 'p') {
            setPaused(true);
        }

        if (key.name === 'r') {
            setLogs(prev => prev + tempLogs());
            setTempLogs('');
            const scrollBox = scroll();
            if (scrollBox) {
                scrollBox.scrollTo({ x: 0, y: scrollBox.scrollHeight })
                scrollBox.stickyScroll = true;
            }
            setPaused(false);
        }
    });

    createEffect(() => {
        logs();
        const scrollBox = scroll();
        if (scrollBox) {
            setWidth(scrollBox.viewport.width);
        }
    });

    createEffect(() => {
        setSelected(
            store.containers.find((c: Container) => c.id === store.activeContainer)
        );
    });

    createEffect(() => {
        if (!store.activeContainer) {
            setLogs('');
            return;
        }

        const filter = store.filters[store.activeContainer] || '';
        const baseCommand = `docker logs --follow --tail 100 ${store.activeContainer}`;
        const shellCommand = filter
            ? `${baseCommand} 2>&1 | grep --line-buffered "${filter}"`
            : baseCommand;

        const process = Bun.spawn([
            'bash',
            '-c',
            shellCommand,
        ], {
            stdout: 'pipe',
            stderr: 'pipe',
        });

        const abortController = new AbortController();

        async function readStream(stream: ReadableStream) {
            const decoder = new TextDecoder();
            const reader = stream.getReader();

            try {
                while (!abortController.signal.aborted) {
                    const { done, value } = await reader.read();
                    if (done) break;


                    const text = decoder.decode(value, { stream: true });
                    const cleanText = stripANSI(text);
                    if (cleanText.length > 0) {
                        if (paused()) {
                            setTempLogs(prev => prev + cleanText);
                            continue;
                        }

                        setLogs(prev => prev + cleanText);
                    }
                }
            } catch (err) {}
        }

        readStream(process.stdout);
        readStream(process.stderr);

        onCleanup(() => {
            abortController.abort();
            process.kill();
            setLogs('');
            setPaused(false);
        });
    });

    return (
        <Pane title='Logs' width='100%' height='100%'>
            <box paddingLeft={1} paddingRight={1} height='100%' flexDirection='column' gap={1}>
                <box height={2} flexDirection='row' justifyContent='space-between'>
                    <box flexDirection='row' gap={1}>
                        <box>
                            <text fg={colors.textMuted} attributes={TextAttributes.BOLD}>
                                Container
                            </text>
                            <text>{selected()?.name}</text>
                        </box>
                        <box>
                            <text fg={colors.textMuted} attributes={TextAttributes.BOLD}>
                                Status
                            </text>
                            <text
                                fg={getColorForContainerState(
                                    false,
                                    selected()?.status,
                                    selected()?.state
                                )}
                            >
                                {selected()?.status}
                            </text>
                        </box>
                        <box>
                            <text fg={colors.textMuted} attributes={TextAttributes.BOLD}>
                                State
                            </text>
                            <text
                                fg={getColorForContainerState(
                                    false,
                                    selected()?.status,
                                    selected()?.state
                                )}
                            >
                                {selected()?.state}
                            </text>
                        </box>
                    </box>
                    <Switch>
                        <Match when={store.activeContainer && !paused()}>
                            <box flexDirection='row' gap={1}>
                                <text fg={colors.text}>[P]</text>
                                <text fg={colors.textMuted}>Pause Logging</text>
                            </box>
                        </Match>
                        <Match when={store.activeContainer && paused()}>
                            <box flexDirection='row' gap={1}>
                                <text fg={colors.text}>[R]</text>
                                <text fg={colors.textMuted}>Resume Logging</text>
                            </box>
                        </Match>
                    </Switch>
                </box>
                <Switch>
                    <Match when={store.activeContainer}>
                        <scrollbox
                            ref={(r: ScrollBoxRenderable) => setScroll(r)}
                            scrollY={true}
                            stickyScroll={true}
                            stickyStart='bottom'
                            flexGrow={1}
                            flexShrink={1}
                        >
                            <code
                                content={logs()}
                                syntaxStyle={logSyntaxStyle}
                                streaming={false}
                                width={width()}
                                fg={colors.textMuted}
                            />
                        </scrollbox>
                    </Match>
                    <Match when={!store.activeContainer && store.containers.length > 0}>
                        <box height='100%' width='100%' paddingLeft={1} paddingRight={1}>
                            <text fg={colors.warning}>No container selected</text>
                            <text fg={colors.textMuted}>
                                Select a container to view logs (use j/k or ↑/↓ to navigate)
                            </text>
                        </box>
                    </Match>
                    <Match when={!store.activeContainer && store.containers.length === 0}>
                        <box height='100%' width='100%' paddingLeft={1} paddingRight={1}>
                            <text fg={colors.warning}>No containers available</text>
                            <text fg={colors.textMuted}>
                                Start a container to view logs
                            </text>
                        </box>
                    </Match>
                </Switch>
            </box>
        </Pane>
    );
}
