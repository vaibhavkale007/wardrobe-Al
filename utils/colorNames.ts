const SHIRT_NAMES = ["Essential", "Studio", "Urban", "Weekend", "Luxe", "Casual"];
const PANTS_NAMES = ["Tailored", "Relaxed", "Slim", "Everyday", "Modern", "Classic"];
const SHOES_NAMES = ["Stride", "Cloud", "Metro", "Fresh", "Active", "Flex"];
const SKIRT_NAMES = ["Flow", "Soft", "Pleated", "Daily", "Breeze", "Curve"];

const TYPE_SUFFIX: Record<string, string[]> = {
  shirt: ["Top", "Shirt", "Blouse", "Tee", "Layer"],
  pants: ["Jeans", "Trousers", "Chinos", "Pants", "Denim"],
  shoes: ["Sneakers", "Loafers", "Kicks", "Runners", "Steps"],
  skirts: ["Skirt", "Leggings", "Bottom", "Wear"],
};

export function generateClothName(type: string, colorName: string): string {
  const pools: Record<string, string[]> = {
    shirt: SHIRT_NAMES,
    pants: PANTS_NAMES,
    shoes: SHOES_NAMES,
    skirts: SKIRT_NAMES,
  };
  const prefixes = pools[type] || SHIRT_NAMES;
  const suffixes = TYPE_SUFFIX[type] || ["Piece"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix} ${colorName} ${suffix}`;
}
