import LogsPane from '@/components/panes/logs-pane';
import FilterPane from '@/components/panes/filter-pane';

export default function RightSidebar() {
    return (
        <box flexDirection="column" gap={1} width="70%" height="100%">
            <LogsPane />
            <FilterPane />
        </box>
    );
}
