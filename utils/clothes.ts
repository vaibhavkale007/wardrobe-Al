import { mpants, mshirts, pants, shoes, skirts, tops } from "../images";
import { useWardrobeStore } from "../store/wardrobeStore";

export type ClothingItem = {
  id: number | string;
  image: string;
  type: string;
  gender: string;
  name?: string;
  color?: string;
  colorName?: string;
  isCustom?: boolean;
};

export const getAllClothes = (): ClothingItem[] =>
  [...pants, ...tops, ...skirts, ...mpants, ...mshirts, ...shoes]
    .map((item, idx) => ({ ...item, id: idx + 1 }))
    .filter((item) => item.image);

export const getCustomClothes = (): ClothingItem[] =>
  useWardrobeStore.getState().customClothes.map((item) => ({
    id: item.id,
    image: item.image,
    type: item.type,
    gender: item.gender,
    name: item.name,
    color: item.color,
    colorName: item.colorName,
    isCustom: true,
  }));

export const getMergedClothes = (): ClothingItem[] => [
  ...getAllClothes(),
  ...getCustomClothes(),
];

export const getShirts = () =>
  getMergedClothes().filter((item) => item.type === "shirt");

export const getBottoms = () =>
  getMergedClothes().filter((item) => item.type === "pants" || item.type === "skirts");

export const getShoes = () => getMergedClothes().filter((item) => item.type === "shoes");

export const TYPE_LABELS: Record<string, string> = {
  shirt: "Shirt",
  pants: "Pants",
  shoes: "Shoes",
  skirts: "Skirt",
};

export const searchClothes = (query: string) => {
  const q = query.toLowerCase().trim();
  if (!q) return getMergedClothes();
  return getMergedClothes().filter((item) => {
    const type = item.type.toLowerCase();
    const gender = item.gender.toLowerCase();
    if (type.includes(q) || gender.includes(q)) return true;
    if (item.gender === "m" && (q.includes("men") || q.includes("male"))) return true;
    if (item.gender === "f" && (q.includes("women") || q.includes("female"))) return true;
    if (type === "shirt" && (q.includes("top") || q.includes("shirt"))) return true;
    if (type === "pants" && (q.includes("pant") || q.includes("jean") || q.includes("bottom"))) return true;
    if (type === "skirts" && q.includes("skirt")) return true;
    if (type === "shoes" && (q.includes("shoe") || q.includes("footwear"))) return true;
    return false;
  });
};

export const COLLECTIONS = [
  {
    id: "essentials",
    name: "Essentials",
    description: "Everyday tops and bottoms",
    filter: (item: { type: string }) =>
      item.type === "shirt" || item.type === "pants",
  },
  {
    id: "weekend",
    name: "Weekend Wear",
    description: "Casual skirts and comfy shoes",
    filter: (item: { type: string }) =>
      item.type === "skirts" || item.type === "shoes",
  },
  {
    id: "mens",
    name: "Men's Collection",
    description: "Shirts and pants for men",
    filter: (item: { gender: string }) => item.gender === "m",
  },
  {
    id: "footwear",
    name: "Footwear",
    description: "All shoes in your wardrobe",
    filter: (item: { type: string }) => item.type === "shoes",
  },
];
