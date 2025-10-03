import { create } from "zustand";

interface VolumeStore {
    volumes: string[];
    setVolumes: (volumes: string[]) => void;
}

export const useVolumeStore = create<VolumeStore>((set) => ({
    volumes: [],
    setVolumes: (volumes: string[]) => set({ volumes }),
}));
