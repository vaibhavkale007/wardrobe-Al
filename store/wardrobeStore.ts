import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "wardrobe-custom-clothes";

export type CustomCloth = {
  id: string;
  image: string;
  type: string;
  gender: string;
  name: string;
  color?: string;
  colorName?: string;
  isCustom: true;
};

type AddClothInput = {
  image: string;
  type: string;
  gender: string;
  name: string;
  color?: string;
  colorName?: string;
};

type WardrobeState = {
  customClothes: CustomCloth[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addCustomCloth: (item: AddClothInput) => Promise<void>;
  removeCustomCloth: (id: string) => Promise<void>;
};

const saveClothes = async (clothes: CustomCloth[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clothes));
};

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  customClothes: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        set({ customClothes: JSON.parse(raw), hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  addCustomCloth: async (item) => {
    const newItem: CustomCloth = {
      ...item,
      id: `custom-${Date.now()}`,
      isCustom: true,
    };
    const updated = [...get().customClothes, newItem];
    set({ customClothes: updated });
    await saveClothes(updated);
  },

  removeCustomCloth: async (id) => {
    const updated = get().customClothes.filter((c) => c.id !== id);
    set({ customClothes: updated });
    await saveClothes(updated);
  },
}));
