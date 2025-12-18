import { createSignal, onCleanup, onMount } from "solid-js";
import { colors } from "@/util/colors";

export function Loader() {
    const FRAMES = [
        "▱▱▱▱▱▱▱",
        "▱▱▱▱▱▱▱",
        "▱▱▱▱▱▱▱",
        "▱▱▱▱▱▱▱",
        "▰▱▱▱▱▱▱",
        "▰▰▱▱▱▱▱",
        "▰▰▰▱▱▱▱",
        "▱▰▰▰▱▱▱",
        "▱▱▰▰▰▱▱",
        "▱▱▱▰▰▰▱",
        "▱▱▱▱▰▰▰",
        "▱▱▱▱▱▰▰",
        "▱▱▱▱▱▱▰",
        "▱▱▱▱▱▱▱",
        "▱▱▱▱▱▱▱",
        "▱▱▱▱▱▱▱",
        "▱▱▱▱▱▱▱",
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

    return <text fg={colors.diffAdded}>{FRAMES[frame()]}</text>
}
