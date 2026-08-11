import { ClothingItem, getMergedClothes } from "./clothes";

export type ColorOption = { name: string; hex: string; key: string };

export const COLOR_OPTIONS: ColorOption[] = [
  { name: "Sunny Yellow", hex: "#EAB308", key: "yellow" },
  { name: "Ruby Red", hex: "#DC2626", key: "red" },
  { name: "Ocean Blue", hex: "#2563EB", key: "blue" },
  { name: "Forest Green", hex: "#16A34A", key: "green" },
  { name: "Sunset Orange", hex: "#EA580C", key: "orange" },
  { name: "Royal Purple", hex: "#7C3AED", key: "purple" },
  { name: "Blush Pink", hex: "#EC4899", key: "pink" },
  { name: "Midnight Black", hex: "#1F2937", key: "black" },
  { name: "Ivory White", hex: "#F3F4F6", key: "white" },
  { name: "Golden Sand", hex: "#D97706", key: "gold" },
  { name: "Teal Mist", hex: "#0D9488", key: "teal" },
  { name: "Lavender Haze", hex: "#A78BFA", key: "lavender" },
];

const SHOP_TYPE_WORD: Record<string, string> = {
  shirt: "shirt top",
  pants: "pants jeans",
  skirts: "skirt leggings",
  shoes: "shoes sneakers",
};

/** Colored product photos for shop preview when color is not in wardrobe */
const COLORED_SHOP_IMAGES: Record<string, Partial<Record<string, string>>> = {
  shirt: {
    yellow: "https://images.pexels.com/photos/7671166/pexels-photo-7671166.jpeg?auto=compress&cs=tinysrgb&w=600",
    red: "https://images.pexels.com/photos/2983468/pexels-photo-2983468.jpeg?auto=compress&cs=tinysrgb&w=600",
    blue: "https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=600",
    green: "https://images.pexels.com/photos/6311652/pexels-photo-6311652.jpeg?auto=compress&cs=tinysrgb&w=600",
    orange: "https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg?auto=compress&cs=tinysrgb&w=600",
    purple: "https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=600",
    pink: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600",
    black: "https://images.pexels.com/photos/5206617/pexels-photo-5206617.jpeg?auto=compress&cs=tinysrgb&w=600",
    white: "https://images.pexels.com/photos/2983468/pexels-photo-2983468.jpeg?auto=compress&cs=tinysrgb&w=600",
    gold: "https://images.pexels.com/photos/7671166/pexels-photo-7671166.jpeg?auto=compress&cs=tinysrgb&w=600",
    teal: "https://images.pexels.com/photos/6311652/pexels-photo-6311652.jpeg?auto=compress&cs=tinysrgb&w=600",
    lavender: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  pants: {
    yellow: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=600",
    red: "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=600",
    blue: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=600",
    green: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=600",
    black: "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=600",
    white: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  skirts: {
    yellow: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=600",
    pink: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600",
    black: "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  shoes: {
    yellow: "https://images.pexels.com/photos/19090/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600",
    red: "https://images.pexels.com/photos/19090/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600",
    blue: "https://images.pexels.com/photos/19090/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600",
    white: "https://images.pexels.com/photos/19090/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600",
    black: "https://images.pexels.com/photos/19090/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600",
  },
};

export function buildShopLink(type: string, colorName: string) {
  const word = SHOP_TYPE_WORD[type] || type;
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(`${colorName} ${word} buy online`)}`;
}

export function getShopPreviewImage(type: string, colorKey: string) {
  const pool = COLORED_SHOP_IMAGES[type] || COLORED_SHOP_IMAGES.shirt;
  return pool?.[colorKey] || pool?.yellow || COLORED_SHOP_IMAGES.shirt?.yellow;
}

export function findWardrobeColorMatch(
  selectedItem: ClothingItem,
  color: ColorOption
): ClothingItem | null {
  const merged = getMergedClothes();
  const match = merged.find((item) => {
    if (item.type !== selectedItem.type) return false;
    const hasColor = item.color === color.hex || item.colorName === color.name;
    if (!hasColor) return false;
    if (item.isCustom) return true;
    return item.id === selectedItem.id;
  });
  return match || null;
}

export type ColorResult = {
  inWardrobe: boolean;
  wardrobeItem: ClothingItem | null;
  displayImage: string;
  displayColor: string | null;
  shopLink: string | null;
  useRecolor: boolean;
};

export function resolveColorResult(
  selectedItem: ClothingItem,
  color: ColorOption
): ColorResult {
  const wardrobeItem = findWardrobeColorMatch(selectedItem, color);

  if (wardrobeItem) {
    return {
      inWardrobe: true,
      wardrobeItem,
      displayImage: wardrobeItem.image,
      displayColor: wardrobeItem.color || color.hex,
      shopLink: null,
      useRecolor: true,
    };
  }

  // Same selected garment recolored + shop link to buy this color
  return {
    inWardrobe: false,
    wardrobeItem: null,
    displayImage: selectedItem.image,
    displayColor: color.hex,
    shopLink: buildShopLink(selectedItem.type, color.name),
    useRecolor: true,
  };
}

export function getShopReferenceImage(type: string, colorKey: string) {
  return getShopPreviewImage(type, colorKey);
}
