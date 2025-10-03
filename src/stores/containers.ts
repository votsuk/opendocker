import { create } from "zustand";

type Container = {
    name: string;
    status: string;
}

interface ContainerStore {
    containers: Container[];
    activeContainer: Container;
    setContainers: (containers: Container[]) => void;
    setActiveContainer: (activeContainer: Container) => void;
}

export const useContainerStore = create<ContainerStore>((set) => ({
    containers: [],
    activeContainer: null,
    setContainers: (containers: Container[]) => set({ containers }),
    setActiveContainer: (activeContainer) => set({ activeContainer }),
}));
