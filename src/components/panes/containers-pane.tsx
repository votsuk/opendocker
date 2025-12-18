import { createEffect, createSignal, onMount, For, Switch, Match } from 'solid-js';
import { TextAttributes, ScrollBoxRenderable } from '@opentui/core';
import { useKeyboard } from '@opentui/solid';
import { colors } from '@/util/colors';
import { Pane } from '@/ui/pane';
import { Docker } from '@/lib/docker';
import application, { type ContainerBareMin } from '@/stores/application';

export default function ContainersPane() {
    const { store, setStore } = application;
    const [containers, setContainers] = createSignal<Array<ContainerBareMin>>([]);
    const [selectedId, setSelectedId] = createSignal<string | undefined>();
    let scroll: ScrollBoxRenderable

    async function createDocker() {
        console.info('Get containers');
        const d = await Docker.getInstance();
        const fetchedContainers = await d.streamContainers();
        setContainers(fetchedContainers);

        if (!store.activeContainer && fetchedContainers.length > 0) {
            setStore('activeContainer', fetchedContainers[0].id);
        }

        setStore('docker', d);
    }

    onMount(() => {
        setInterval(() => {
            createDocker();;
        }, 1000);
    });

    function getSelectedIndex() {
        if (!selectedId()) {
            return -1;
        }

        return containers().findIndex(c => c.id === selectedId());
    }

    useKeyboard((key) => {
        if (key.name === 'k') {
           const index = getSelectedIndex();
            if (index === 0 || index === -1) {
                return;
            }

            const newSelected = containers()[index - 1];
            setStore('activeContainer', newSelected.id);
        }
    
        if (key.name === 'j') {
            const index = getSelectedIndex();
            if (index === -1 || index >= containers().length - 1) {
                return;
            }

            const newSelected = containers()[index + 1];
            setStore('activeContainer', newSelected.id);
        }
    });

    createEffect(() => {
        setSelectedId(store.activeContainer);
    });

    createEffect(() => {
        if (!store.activeContainer && containers().length > 0) {
            setStore('activeContainer', containers()[0].id);
        }
    });

    function getColorForContainerState(status: string, state: string, isActive: boolean) {
        if (isActive) {
            return colors.backgroundPanel;
        }

        switch (state) {
            case "running":
                if (status.includes("unhealthy")) {
                    return colors.warning;
                }
                return colors.success;
            case "exited":
                return colors.error;
            case "created":
                return colors.warning;
            default:
                return colors.textMuted;
        }
    }

    return (
        <Pane title="Containers" width="100%" height="100%" borderColor={colors.secondary}>
            <Switch>
                <Match when={containers().length > 0}>
                    <scrollbox
                        ref={(r: ScrollBoxRenderable) => (scroll = r)}
                        scrollY={true}
                        stickyScroll={true}
                        stickyStart="bottom"
                        viewportOptions={{
                            flexGrow: 1
                        }}
                    >
                        <For each={containers()}>
                            {(container: ContainerBareMin) => {
                                const isActive = () => store.activeContainer === container.id;
                                return (
                                    <box
                                        backgroundColor={isActive() ? colors.secondary : undefined}
                                        flexDirection="row"
                                        justifyContent="space-between"
                                        paddingLeft={1}
                                        paddingRight={1}
                                    >
                                        <text
                                            fg={isActive() ? colors.backgroundPanel : colors.textMuted}
                                            attributes={isActive() ? TextAttributes.BOLD : undefined}
                                        >
                                            {container.name}
                                        </text>
                                        <text
                                            fg={getColorForContainerState(container.status, container.state, isActive())}
                                        >
                                            {container.state}
                                        </text>
                                    </box>
                            )}}
                        </For>
                    </scrollbox>
                </Match>
                <Match when={containers().length === 0}>
                    <box paddingLeft={1} paddingRight={1}>
                        <text fg={colors.textMuted}>
                            No Containers
                        </text>
                    </box>
                </Match>
            </Switch>
        </Pane>
    )
}
