import { useKeyboard, useRenderer } from '@opentui/solid';
import { ErrorBoundary } from 'solid-js';
import { ErrorComponent } from '@/components/error-component';
import { BaseLayout } from '@/layouts/base-layout';
import LeftSidebar from './components/left-sidebar';
import RightSidebar from './components/right-sidebar';
import { ToastProvider, useToast } from './ui/toast';
import { Clipboard } from './util/clipboard';
import application from './stores/application';

export function tui() {
    const LOGO = [
      [`                    `, `   ▄                         `], 
      [`█▀▀█ █▀▀█ █▀▀█ █▀▀▄ `, `█▀▀█ █▀▀█ █▀▀▀ █  █ █▀▀█ █▀▀▀`],
      [`█░░█ █░░█ █▀▀▀ █░░█ `, `█░░█ █░░█ █░░░ █▀▄░ █▀▀▀ █░░░`],
      [`▀▀▀▀ █▀▀▀ ▀▀▀▀ ▀  ▀ `, `▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀  ▀ ▀▀▀▀ ▀   `],
    ]
     
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
    const { store } = application;

    useKeyboard(event => {
        if (store.filtering) return;

        if (event.name === 'q') {
            exit();
        }

        if (event.ctrl && event.name === 'd') {
            renderer?.console.toggle();
            renderer?.toggleDebugOverlay();
        }
    });

    function exit() {
        renderer.setTerminalTitle('');
        renderer.destroy();
        process.exit(0);
    }

    return (
        <box
            width="100%"
            height="100%"
            flexDirection="row"
            gap={1}
            onMouseUp={async () => {
                const text = renderer.getSelection()?.getSelectedText();
                if (text && text.length > 0) {
                    const base64 = Buffer.from(text).toString('base64');
                    const osc52 = `\x1b]52;c;${base64}\x07`;
                    const finalOsc52 = process.env['TMUX'] ? `\x1bPtmux;\x1b${osc52}\x1b\\` : osc52;
                    /* @ts-expect-error */
                    renderer.writeOut(finalOsc52);
                    await Clipboard.copy(text)
                        .then(() => toast.show({ message: 'Copied to clipboard', variant: 'info' }))
                        .catch(toast.error);
                    renderer.clearSelection();
                }
            }}
        >
            <LeftSidebar />
            <RightSidebar />
        </box>
    );
}
