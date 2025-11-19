import { SplitBorder } from "./Border";
import type { BoxProps } from "@opentui/react";
import { padding, colors, termColors } from "../utils/styling";
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
            {...props}
            borderColor={active ? termColors.purple11 : colors.backgroundPanel}
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
