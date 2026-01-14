import { type ScrollBoxRenderable, TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/solid';
import {
    createEffect,
    createSignal,
    For,
    Match,
    onMount,
    Switch,
    onCleanup,
} from 'solid-js';
import application, { type Container } from '@/stores/application';
import { Pane } from '@/ui/pane';
import { colors, getColorForContainerState } from '@/util/colors';
import { Loader } from '@/ui/loader';

export default function ContainersPane() {
    const { store, setStore } = application;
    const [selectedId, setSelectedId] = createSignal<string | undefined>();
    const [loaded, setLoaded] = createSignal<boolean>(false);
    let scroll: ScrollBoxRenderable;
    const maxStateLength = () => Math.max(...store.containers.map(c => c.state.length), 0);

    function validateActiveContainer(containers: Array<Container>, activeId: string | undefined) {
        if (!activeId) return containers[0]?.id; 
        const exists = containers.find((c: Container) => c.id === activeId);
        return exists? activeId : containers[0]?.id;
    }

    async function containerPulse() {
        const d = store.docker;
        if (!d) return;

        const fetchedContainers = await d?.streamContainers() || [];
        setStore('containers', fetchedContainers);

        const validActiveId = validateActiveContainer(fetchedContainers, store.activeContainer);
        if (validActiveId !== store.activeContainer) {
            setStore('activeContainer', validActiveId);
        }

        setLoaded(true);
    }

    onMount(() => {
        containerPulse();

        const intervalId = setInterval(() => {
            containerPulse();
        }, 1000);

        onCleanup(() => {
            clearInterval(intervalId);
        });
    });

    function getSelectedIndex() {
        if (!selectedId()) {
            return -1;
        }

        return store.containers.findIndex(c => c.id === selectedId());
    }

    useKeyboard(key => {
        if (store.filtering) return;

        if (key.name === 'k') {
            const index = getSelectedIndex();
            if (index === -1 && store.containers.length > 0) {
                setStore('activeContainer', store.containers[store.containers.length - 1].id);
            };

            if (index === 0) {
                return;
            }

            const newSelected = store.containers[index - 1];
            setStore('activeContainer', newSelected.id);
        }

        if (key.name === 'j') {
            const index = getSelectedIndex();

            if (index === -1 && store.containers.length > 0) {
                setStore('activeContainer', store.containers[0].id);
                return;
            }

            if (index >= store.containers.length - 1) {
                return;
            }

            const newSelected = store.containers[index + 1];
            setStore('activeContainer', newSelected.id);
        }
    });

    createEffect(() => {
        setSelectedId(store.activeContainer);
    });

    createEffect(() => {
        if (!store.activeContainer && store.containers.length > 0) {
            setStore('activeContainer', store.containers[0].id);
        }
    });

    return (
        <Pane
            title="Containers"
            width="100%"
            height="100%"
            borderColor={() => store.activePane === 'containers' ? colors.secondary : colors.backgroundPanel}
        >
            <Switch>
                <Match when={store.containers.length > 0}>
                    <scrollbox
                        ref={(r: ScrollBoxRenderable) => (scroll = r)}
                        scrollY={true}
                        scrollX={true}
                        stickyScroll={true}
                        stickyStart="bottom"
                        height="100%"
                    >
                        <For each={store.containers}>
                            {(container: Container) => {
                                const isActive = () => store.activeContainer === container.id;
                                return (
                                    <box
                                        backgroundColor={isActive() ? colors.secondary : undefined}
                                        flexDirection="row"
                                        gap={1}
                                        paddingLeft={1}
                                        paddingRight={1}
                                    >
                                        <text
                                            fg={getColorForContainerState(
                                                isActive(),
                                                container.status,
                                                container.state
                                            )}
                                            attributes={
                                                isActive() ? TextAttributes.BOLD : undefined
                                            }
                                            flexShrink={0}
                                        >
                                            {container.state.padEnd(maxStateLength())}
                                        </text>
                                        <text
                                            fg={
                                                isActive()
                                                    ? colors.backgroundPanel
                                                    : colors.textMuted
                                            }
                                            attributes={
                                                isActive() ? TextAttributes.BOLD : undefined
                                            }
                                            flexShrink={1}
                                            flexGrow={1}
                                            wrapMode='none'
                                        >
                                            {container.name}
                                        </text>
                                    </box>
                                );
                            }}
                        </For>
                    </scrollbox>
                </Match>
                <Match when={store.containers.length === 0 && loaded()}>
                    <box flexDirection="column" height="100%" width="100%">
                        <box paddingLeft={1} paddingRight={1} paddingBottom={1}>
                            <text fg={colors.warning}>No containers running</text>
                            <text fg={colors.textMuted}>
                                Try: docker run hello-world to get started
                            </text>
                        </box>
                    </box>
                </Match>
                <Match when={store.containers.length === 0 && !loaded()}>
                    <box height="100%" width="100%" paddingLeft={1} paddingRight={1}>
                        <Loader />
                    </box>
                </Match>
            </Switch>
        </Pane>
    );
}
