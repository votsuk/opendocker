import { ErrorBoundary } from 'solid-js';
import { ErrorComponent } from '@/components/error-component';
import { BaseLayout } from '@/layouts/base-layout';
import { useKeyboard, useRenderer } from '@opentui/solid';
import LeftSidebar from './components/left-sidebar';
import RightSidebar from './components/right-sidebar';
import { Clipboard } from './util/clipboard';
import { ToastProvider, useToast } from './ui/toast';

export function tui() {
    return (
        <ToastProvider>
            <BaseLayout>
                <ErrorBoundary fallback={(error, _) => <ErrorComponent error={error} />}>
                    <App />
                </ErrorBoundary>
            </BaseLayout>
        </ToastProvider>
    );
}

function App() {
    const renderer = useRenderer();
    const toast = useToast();

    useKeyboard((event) => {
        if (event.name === 'q') {
            process.exit(0);
        }

        if (event.ctrl && event.name === "d") {
            renderer?.console.toggle()
            renderer?.toggleDebugOverlay()
        }
    });

    return (
        <box
            width="100%"
            height="100%"
            flexDirection="row"
            gap={1}
            onMouseUp={async () => {
                const text = renderer.getSelection()?.getSelectedText()
                if (text && text.length > 0) {
                    const base64 = Buffer.from(text).toString("base64")
                    const osc52 = `\x1b]52;c;${base64}\x07`
                    const finalOsc52 = process.env["TMUX"] ? `\x1bPtmux;\x1b${osc52}\x1b\\` : osc52
                    /* @ts-expect-error */
                    renderer.writeOut(finalOsc52)
                    await Clipboard.copy(text)
                        .then(() => toast.show({ message: "Copied to clipboard", variant: "info" }))
                        .catch(toast.error)
                    renderer.clearSelection()
                }
            }}
        >
            <LeftSidebar />
            <RightSidebar />
        </box>
    );
}
