import ContainersPane from '@/components/panes/containers-pane';

export default function LeftSidebar() {
    return (
        <box flex-direction="column" width="30%" height="100%" gap={1}>
            <ContainersPane />
        </box>
    );
}
