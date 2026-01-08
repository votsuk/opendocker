import { createSignal, onCleanup, onMount } from 'solid-js';
import { colors } from '@/util/colors';

interface LoaderProps {
    color?: string;
}

export function Loader(props: LoaderProps) {
    const FRAMES = [
        '▱▱▱▱▱▱▱',
        '▱▱▱▱▱▱▱',
        '▱▱▱▱▱▱▱',
        '▱▱▱▱▱▱▱',
        '▰▱▱▱▱▱▱',
        '▰▰▱▱▱▱▱',
        '▰▰▰▱▱▱▱',
        '▱▰▰▰▱▱▱',
        '▱▱▰▰▰▱▱',
        '▱▱▱▰▰▰▱',
        '▱▱▱▱▰▰▰',
        '▱▱▱▱▱▰▰',
        '▱▱▱▱▱▱▰',
        '▱▱▱▱▱▱▱',
        '▱▱▱▱▱▱▱',
        '▱▱▱▱▱▱▱',
        '▱▱▱▱▱▱▱',
    ];
    const [frame, setFrame] = createSignal(0);

    onMount(() => {
        const timer = setInterval(() => {
            setFrame((frame() + 1) % FRAMES.length);
        }, 77);

        onCleanup(() => {
            clearInterval(timer);
        });
    });

    return <text fg={props.color || colors.diffAdded}>{FRAMES[frame()]}</text>;
}
