import { createContext, useContext, type ParentProps, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { useTerminalDimensions } from "@opentui/solid"
import { SplitBorder } from "@/components/border"
import { TextAttributes } from "@opentui/core"
import { colors } from "../util/colors"

interface ToastOptions {
    title?: string,
    message: string,
    variant: "info" |"success" | "warning" | "error",
    duration?: number,
}

export function Toast() {
    const toast = useToast()
    const dimensions = useTerminalDimensions()

    return (
        <Show when={toast.currentToast}>
            {(current) => (
                <box
                    position="absolute"
                    justifyContent="center"
                    alignItems="flex-start"
                    top={2}
                    right={2}
                    maxWidth={Math.min(60, dimensions().width - 6)}
                    paddingLeft={2}
                    paddingRight={2}
                    paddingTop={1}
                    paddingBottom={1}
                    backgroundColor={colors.backgroundPanel}
                    borderColor={colors.secondary}
                    border={["left", "right"]}
                    customBorderChars={SplitBorder.customBorderChars}
                >
                    <Show when={current().title}>
                        <text attributes={TextAttributes.BOLD} marginBottom={1} fg={colors.text}>
                            {current().title}
                        </text>
                    </Show>
                    <text fg={colors.text} wrapMode="word" width="100%">
                        {current().message}
                    </text>
                </box>
            )}
        </Show>
    )
}

function init() {
    const [store, setStore] = createStore({
        currentToast: null as ToastOptions | null,
    })

    let timeoutHandle: NodeJS.Timeout | null = null

    const toast = {
        show(options: ToastOptions) {
            const { duration, ...currentToast } = options
            setStore("currentToast", currentToast)
            if (timeoutHandle) clearTimeout(timeoutHandle)
            timeoutHandle = setTimeout(() => {
                setStore("currentToast", null)
            }, duration || 5000).unref()
        },
        error: (err: any) => {
            if (err instanceof Error)
                return toast.show({
                    variant: "error",
                    message: err.message,
                })
            toast.show({
                variant: "error",
                message: "An unknown error has occurred",
            })
        },
        get currentToast(): ToastOptions | null {
            return store.currentToast
        },
    }
    return toast
}

export type ToastContext = ReturnType<typeof init>

const ctx = createContext<ToastContext>()

export function ToastProvider(props: ParentProps) {
    const value = init()
    return <ctx.Provider value={value}>{props.children}</ctx.Provider>
}

export function useToast() {
    const value = useContext(ctx)
    if (!value) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return value
}
