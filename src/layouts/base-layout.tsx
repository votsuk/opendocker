import { $ } from 'bun';
import { TextAttributes } from '@opentui/core';
import type { JSX } from 'solid-js';
import { createSignal, onMount } from 'solid-js';
import { Toast } from '@/ui/toast';
import { colors } from '@/util/colors';
import { Docker } from '@/lib/docker';
import application from '@/stores/application';

export function BaseLayout({ children }: { children: JSX.Element }) {
    const { setStore } = application;
    const [pwd, setPwd] = createSignal('');
    const version = getVersion();

    onMount(() => {
        $`pwd`.quiet().then(result => setPwd(`~${result.text().trim()}`));
        getCurrentBranch().then(res => res && setPwd(`${pwd()}:${res}`));
        createDockerInstance();
    });

    function createDockerInstance() {
        const d = Docker.getInstance();
        setStore('docker', d);
    }

    async function getCurrentBranch() {
        return $`git rev-parse --abbrev-ref HEAD`
            .quiet()
            .nothrow()
            .text()
            .then((x) => x.trim());
    }

    function getVersion() {
        const version = typeof OPENDOCKER_VERSION !== 'undefined' ? OPENDOCKER_VERSION : 'local';
        return 'v' + version;
    }

    return (
        <>
            <Toast />
            <box width="100%" height="100%" backgroundColor={colors.background}>
                <box height="100%" width="100%" padding={1}>
                    {children}
                </box>
                <box
                    width="100%"
                    height="auto"
                    flexDirection="row"
                    justifyContent="space-between"
                    paddingLeft={1}
                    paddingRight={1}
                    paddingBottom={1}
                >
                    <box flexDirection="row" gap={1}>
                        <box
                            flexDirection="row"
                            gap={1}
                        >
                            <box flexDirection="row">
                                <text fg={colors.textMuted} attributes={TextAttributes.BOLD}>
                                    open
                                </text>
                                <text fg={colors.text} attributes={TextAttributes.BOLD}>
                                    docker
                                </text>
                            </box>
                        </box>
                        <box>
                            <text fg={colors.textMuted}>{pwd()}</text>
                        </box>
                    </box>
                    <box>
                        <text fg={colors.textMuted}>{version}</text>
                    </box>
                </box>
            </box>
        </>
    );
}
