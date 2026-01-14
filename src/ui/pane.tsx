import { TextAttributes } from '@opentui/core';
import type { BoxProps } from '@opentui/solid';
import { splitProps, type Accessor, type JSX } from 'solid-js';
import { SplitBorder } from '@/components/border';
import { colors } from '@/util/colors';

interface PaneProps extends Omit<BoxProps, 'borderColor'> {
    children: JSX.Element;
    title?: string;
    borderColor?: Accessor<string> | string;
}

export function Pane(props: PaneProps) {
    const [local, others] = splitProps(props, ['children', 'title', 'borderColor']);

    function getBorderColor() {
        if (!local.borderColor) return colors.backgroundPanel;
        if (typeof local.borderColor === 'function') return local.borderColor();
        return local.borderColor;
    }

    return (
        <box
            border={['left']}
            customBorderChars={SplitBorder.customBorderChars}
            borderColor={getBorderColor()}
            {...others}
        >
            <box
                backgroundColor={colors.backgroundPanel}
                paddingTop={1}
                paddingBottom={1}
                width="100%"
                height="auto"
                paddingLeft={1}
                paddingRight={1}
            >
                {local.title && (
                    <text
                        attributes={TextAttributes.BOLD}
                        marginBottom={1}
                        marginLeft={1}
                        marginRight={1}
                        fg={colors.text}
                    >
                        {local.title}
                    </text>
                )}
                {local.children}
            </box>
        </box>
    );
}
