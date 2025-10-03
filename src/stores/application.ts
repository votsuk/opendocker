import { create } from "zustand";

interface ApplicationStore {
    activePane: string;
    setActivePane: (activePane: string) => void;
}

export const useApplicationStore = create<ApplicationStore>((set) => ({
    activePane: "containers",
    setActivePane: (activePane) => set({ activePane }),
}));
