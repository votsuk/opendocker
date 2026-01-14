import { createSignal, Switch, Match, createEffect } from 'solid-js';
import { KeyEvent, TextareaRenderable } from '@opentui/core';
import { useKeyboard } from '@opentui/solid';
import { colors } from '@/util/colors';
import { SplitBorder } from '../border';
import application from '@/stores/application';

export default function FilterPane() {
    const { store, setStore } = application;
    const [value, setValue] = createSignal<string>('');
    let input: TextareaRenderable;

    useKeyboard(key => {
        if (key.name === 'f') {
            if (!input.focused) {
                input.focus();
                input.cursorOffset = input.plainText.length;
                key.preventDefault();
                setStore('activePane', 'filter');
                setStore('filtering', true);
                return;
            }
        }
    });

    function submit(key: KeyEvent) {
        input.submit();
        input.blur();
        key.preventDefault();
        setStore('filtering', false);

        setStore('activePane', 'containers');
        if (store.activeContainer) {
            setStore('filters', store.activeContainer, value());
        }

        return;
    }

    function cancel(key: KeyEvent) {
        input.blur();
        key.preventDefault();
        setStore('filtering', false);

        setStore('activePane', 'containers');
        input.setText('');
        if (store.activeContainer) {
            setStore('filters', store.activeContainer, '');
        }
        return;
    }

    createEffect(() => {
        if (store.activeContainer) {
            const filterValue = store.filters[store.activeContainer] || '' ;
            setValue(filterValue);

            if (input) {
                input.setText(filterValue);
            }
        }
    });

    return (
        <box
            border={['left']}
            customBorderChars={SplitBorder.customBorderChars}
            borderColor={store.activePane === 'filter' ? colors.secondary : colors.backgroundPanel}
        >
            <box backgroundColor={colors.backgroundPanel} flexDirection="row">
                <box
                    gap={1}
                    paddingLeft={1}
                    paddingRight={3}
                    paddingTop={1}
                    paddingBottom={1}
                    width='100%'
                >
                    <textarea
                        marginLeft={1}
                        placeholder={`Type to filter... "GET /api"`}
                        textColor={colors.textMuted}
                        focusedTextColor={colors.text}
                        minHeight={1}
                        maxHeight={1}
                        onContentChange={() => setValue(input.plainText)}
                        ref={(r: TextareaRenderable) => {
                            input = r;
                            setTimeout(() => {
                                input.cursorColor = colors.text;
                            }, 0);
                        }}
                        focusedBackgroundColor={colors.backgroundPanel}
                        cursorColor={colors.warning}
                        onKeyDown={key => {
                            if (key.name === 'enter' || key.name === 'return') {
                                submit(key);
                            }

                            if (key.name === 'escape') {
                                cancel(key);
                            }
                        }}
                    />
                </box>
                <box
                    flexDirection="row"
                    flexShrink={0}
                    gap={1}
                    paddingTop={1}
                    paddingLeft={1}
                    paddingRight={2}
                    paddingBottom={1}
                    backgroundColor={colors.backgroundElement}
                    justifyContent="space-between"
                >
                    <box flexDirection="row" gap={1}>
                    </box>
                    <box flexDirection="row" gap={2}>
                        <Switch>
                            <Match when={!store.filtering}>
                                <text fg={colors.text}>
                                    {"f"} <span style={{ fg: colors.textMuted }}>filter</span>
                                </text>
                            </Match>
                            <Match when={store.filtering}>
                                <text fg={colors.text}>
                                    esc <span style={{ fg: colors.textMuted }}>cancel</span>
                                </text>
                                <text fg={colors.text}>
                                    enter <span style={{ fg: colors.textMuted }}>confirm</span>
                                </text>
                            </Match>
                        </Switch>
                    </box>
                </box>
            </box>
        </box>
    );
}
