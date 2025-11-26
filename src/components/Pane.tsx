import { SplitBorder } from "./border";
import type { BoxProps } from "@opentui/react";
import { padding, colors } from "../utils/styling";
import { TextAttributes } from "@opentui/core";

interface PaneProps extends BoxProps {
    title?: string;
    active?: boolean;
    children: React.ReactNode;
}

export default function Pane({
    title,
    active = false,
    children,
    ...props
}: PaneProps) {
    return (
        <box
            {...SplitBorder}
            borderColor={active ? colors.secondary : colors.backgroundPanel}
            {...props}
        >
            <box
                flexGrow={1}
                backgroundColor={colors.backgroundPanel}
                {...padding}
            >
                {title && <text marginBottom={1} attributes={TextAttributes.BOLD}>{title}</text>}
                {children}
            </box>
        </box>
    )
}
