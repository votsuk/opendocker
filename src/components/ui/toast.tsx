import { createContext, useContext, useState, type ReactNode } from "react"
import { useTerminalDimensions } from "@opentui/react"
import { SplitBorder } from "../Border"
import { TextAttributes } from "@opentui/core"
import { colors } from "../../utils/styling"

export interface ToastOptions {
    variant: "info" | "success" | "warning" | "error"
    message: string
    title?: string
    duration?: number
}

export function Toast() {
    const toast = useToast()
    const dimensions = useTerminalDimensions()

    return (
        <>
            {toast.currentToast && (
                <box
                    position="absolute"
                    justifyContent="center"
                    alignItems="flex-start"
                    top={2}
                    right={2}
                    maxWidth={Math.min(60, dimensions.width - 6)}
                    paddingLeft={2}
                    paddingRight={2}
                    paddingTop={1}
                    paddingBottom={1}
                    backgroundColor={colors.backgroundElement}
                    borderColor={colors[toast.currentToast.variant]}
                    border={["left", "right"]}
                    customBorderChars={SplitBorder.customBorderChars}
                >
                    {toast.currentToast.title && (
                        <text attributes={TextAttributes.BOLD} marginBottom={1} fg={colors.text}>
                            {toast.currentToast.title}
                        </text>
                    )}
                    <text fg={colors.text}>{toast.currentToast.message}</text>
                </box>
            )}
        </>
    )
}

function useToastState() {
    return useState<ToastOptions | null>(null)
}

function init() {
    const [currentToast, setCurrentToast] = useToastState()

    let timeoutHandle: NodeJS.Timeout | null = null

    const toast = {
        show(options: ToastOptions) {
            const { duration = 3000, ...toastOptions } = options
            setCurrentToast(toastOptions)
            if (timeoutHandle) clearTimeout(timeoutHandle)
            timeoutHandle = setTimeout(() => {
                setCurrentToast(null)
            }, duration).unref()
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
            return currentToast
        },
    }
    return toast
}

export type ToastContext = ReturnType<typeof init>

const ctx = createContext<ToastContext>(undefined!)

export function ToastProvider({ children }: { children: ReactNode }) {
    const value = init()
    return <ctx.Provider value={value}>{children}</ctx.Provider>
}

export function useToast() {
    const value = useContext(ctx)
    if (!value) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return value
}
