import { createStore } from "solid-js/store";
import { Docker } from '@/lib/docker';

export interface ContainerBareMin {
    id: string;
    name: string;
    state: string;
    status: string;
}

interface ApplicationStore {
    activeContainer: string | undefined;
    docker: Docker | undefined;
}

const [store, setStore] = createStore<ApplicationStore>({
    activeContainer: undefined,
    docker: undefined,
});

export default { store, setStore };
