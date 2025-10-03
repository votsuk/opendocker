import { create } from "zustand";

export interface ImageStore {
    images: string[];
    setImages: (images: string[]) => void;
}

export const useImageStore = create<ImageStore>((set) => ({
  images: [],
  setImages: (images: string[]) => set({ images }),
}));
