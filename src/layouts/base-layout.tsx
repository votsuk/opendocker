import type { JSX } from 'solid-js';
import { onMount } from 'solid-js';
import { Toast } from '@/ui/toast';
import { colors } from '@/util/colors';
import { Docker } from '@/lib/docker';
import application from '@/stores/application';
import Footer from '@/components/footer';

export function BaseLayout({ children }: { children: JSX.Element }) {
    const { setStore } = application;

    onMount(() => {
        createDockerInstance();
    });

    function createDockerInstance() {
        const d = Docker.getInstance();
        setStore('docker', d);
    }

    return (
        <>
            <Toast />
            <box width="100%" height="100%" backgroundColor={colors.background}>
                <box height="100%" width="100%" padding={1}>
                    {children}
                </box>
                <Footer />
            </box>
        </>
    );
}
