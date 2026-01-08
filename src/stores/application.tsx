import { createStore } from 'solid-js/store';
import type { Docker } from '@/lib/docker';

export interface Container {
    id: string;
    name: string;
    state: string;
    status: string;
}

interface ApplicationStore {
    containers: Array<Container>;
    activeContainer: string | undefined;
    docker: Docker | undefined;
    activePane: string;
    containerFilters: Record<string, string>;
    filtering: boolean;
}

const [store, setStore] = createStore<ApplicationStore>({
    containers: [],
    activeContainer: undefined,
    docker: undefined,
    activePane: 'containers',
    containerFilters: {},
    filtering: false,
});

export default { store, setStore };
