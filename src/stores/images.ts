import { create } from "zustand";

interface ImageStore {
    images: any;
    setImages: (images: any) => void;
}

export const useImageStore = create<ImageStore>((set) => ({
  images: [],
  setImages: (images: any) => set({ images }),
}));
