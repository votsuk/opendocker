import type { JSX } from 'solid-js';
import type { BoxProps } from '@opentui/solid';
import Card from './card';
import { TextAttributes } from "@opentui/core";

interface PaneProps extends BoxProps {
    children: JSX.Element;
    title?: string;
}

export function Pane({
    children,
    title,
    ...boxProps
}: PaneProps) {
    return (
        <Card {...boxProps}>
            {title && (
                <text
                    attributes={TextAttributes.BOLD}
                    marginBottom={1}
                    marginLeft={1}
                    marginRight={1}
                >
                    {title}
                </text>
            )}
            {children}
        </Card>
    );
}
