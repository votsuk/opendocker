import type { JSX } from 'solid-js';
import { colors } from '@/util/colors';
import { SplitBorder } from '@/components/border';
import type { BoxProps } from '@opentui/solid';
import { padding } from '@/util/styles';

interface CardProps extends BoxProps {
    children: JSX.Element;

}

export default function Card({
    children,
    ...boxProps
}: CardProps) {
    return (
        <box
            {...SplitBorder}
            borderColor={colors.backgroundPanel}
            {...boxProps}
        >
            <box
                backgroundColor={colors.backgroundPanel}
                {...padding}
                width="100%"
                height="100%"
            >
                {children}
            </box>
        </box>

    );
}
