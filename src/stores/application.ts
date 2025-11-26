import { create } from "zustand";

interface ApplicationStore {
    activePane: string;
    setActivePane: (activePane: string) => void;
    filterFocus: boolean;
    setFilterFocus: (filterFocus: boolean) => void;
    systemError: Error | undefined;
    setSystemError: (systemError: Error | undefined) => void;
}

export const useApplicationStore = create<ApplicationStore>((set) => ({
    activePane: "containers",
    setActivePane: (activePane) => set({ activePane }),
    filterFocus: false,
    setFilterFocus: (filterFocus) => set({ filterFocus }),
    systemError: undefined,
    setSystemError: (systemError) => set({ systemError }),
}));
