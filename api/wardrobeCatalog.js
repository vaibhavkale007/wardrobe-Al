// Wardrobe catalog — mirrors frontend images/index.js with names & shop links

const shopSearch = (query) =>
  `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;

export const WARDROBE = [
  { uid: "f-pants-1", id: 1, name: "Classic Blue Jeans", type: "pants", gender: "f", image: "https://pngimg.com/uploads/jeans/jeans_PNG5753.png", shopLink: shopSearch("women blue jeans") },
  { uid: "f-pants-2", id: 2, name: "Slim Fit Jeans", type: "pants", gender: "f", image: "https://pngimg.com/uploads/jeans/jeans_PNG5765.png", shopLink: shopSearch("women slim jeans") },
  { uid: "f-pants-3", id: 3, name: "Dark Wash Jeans", type: "pants", gender: "f", image: "https://pngimg.com/uploads/jeans/jeans_PNG5778.png", shopLink: shopSearch("women dark wash jeans") },
  { uid: "f-shirt-1", id: 4, name: "White Casual T-Shirt", type: "shirt", gender: "f", image: "https://pngimg.com/uploads/tshirt/tshirt_PNG5450.png", shopLink: shopSearch("women white tshirt") },
  { uid: "f-shirt-2", id: 5, name: "Grey Basic Tee", type: "shirt", gender: "f", image: "https://pngimg.com/uploads/tshirt/tshirt_PNG5451.png", shopLink: shopSearch("women grey tshirt") },
  { uid: "f-shirt-3", id: 6, name: "Navy Cotton T-Shirt", type: "shirt", gender: "f", image: "https://pngimg.com/uploads/tshirt/tshirt_PNG5452.png", shopLink: shopSearch("women navy tshirt") },
  { uid: "f-shirt-4", id: 7, name: "Striped T-Shirt", type: "shirt", gender: "f", image: "https://pngimg.com/uploads/tshirt/tshirt_PNG5454.png", shopLink: shopSearch("women striped tshirt") },
  { uid: "f-shirt-5", id: 8, name: "Formal Dress Shirt", type: "shirt", gender: "f", image: "https://pngimg.com/uploads/dress_shirt/dress_shirt_PNG8083.png", shopLink: shopSearch("women dress shirt formal") },
  { uid: "f-shirt-6", id: 9, name: "Office Blouse Shirt", type: "shirt", gender: "f", image: "https://pngimg.com/uploads/dress_shirt/dress_shirt_PNG8105.png", shopLink: shopSearch("women office blouse") },
  { uid: "f-shirt-7", id: 10, name: "Pastel Casual Tee", type: "shirt", gender: "f", image: "https://pngimg.com/uploads/tshirt/tshirt_PNG5448.png", shopLink: shopSearch("women pastel tshirt") },
  { uid: "f-shirt-8", id: 11, name: "Black Everyday Tee", type: "shirt", gender: "f", image: "https://pngimg.com/uploads/tshirt/tshirt_PNG5436.png", shopLink: shopSearch("women black tshirt") },
  { uid: "f-skirt-1", id: 12, name: "Black Leggings", type: "skirts", gender: "f", image: "https://pngimg.com/uploads/leggings/leggings_PNG46.png", shopLink: shopSearch("women black leggings") },
  { uid: "f-skirt-2", id: 13, name: "Grey Leggings", type: "skirts", gender: "f", image: "https://pngimg.com/uploads/leggings/leggings_PNG47.png", shopLink: shopSearch("women grey leggings") },
  { uid: "f-skirt-3", id: 14, name: "Navy Leggings", type: "skirts", gender: "f", image: "https://pngimg.com/uploads/leggings/leggings_PNG48.png", shopLink: shopSearch("women navy leggings") },
  { uid: "m-pants-1", id: 15, name: "Men's Blue Jeans", type: "pants", gender: "m", image: "https://pngimg.com/uploads/jeans/jeans_PNG5777.png", shopLink: shopSearch("men blue jeans") },
  { uid: "m-pants-2", id: 16, name: "Men's Slim Jeans", type: "pants", gender: "m", image: "https://pngimg.com/uploads/jeans/jeans_PNG5778.png", shopLink: shopSearch("men slim jeans") },
  { uid: "m-pants-3", id: 17, name: "Men's Dark Jeans", type: "pants", gender: "m", image: "https://pngimg.com/uploads/jeans/jeans_PNG5779.png", shopLink: shopSearch("men dark jeans") },
  { uid: "m-shirt-1", id: 18, name: "Men's Dress Shirt", type: "shirt", gender: "m", image: "https://pngimg.com/uploads/dress_shirt/dress_shirt_PNG8084.png", shopLink: shopSearch("men dress shirt") },
  { uid: "m-shirt-2", id: 19, name: "Men's Formal Shirt", type: "shirt", gender: "m", image: "https://pngimg.com/uploads/dress_shirt/dress_shirt_PNG8085.png", shopLink: shopSearch("men formal shirt") },
  { uid: "m-shirt-3", id: 20, name: "Men's Office Shirt", type: "shirt", gender: "m", image: "https://pngimg.com/uploads/dress_shirt/dress_shirt_PNG8105.png", shopLink: shopSearch("men office shirt") },
  { uid: "shoes-1", id: 21, name: "Classic Sneakers", type: "shoes", gender: "unisex", image: "https://pngimg.com/uploads/men_shoes/men_shoes_PNG7485.png", shopLink: shopSearch("unisex white sneakers") },
  { uid: "shoes-2", id: 22, name: "Casual Heels", type: "shoes", gender: "unisex", image: "https://pngimg.com/uploads/women_shoes/women_shoes_PNG7438.png", shopLink: shopSearch("women casual heels") },
];

export const getAllWardrobe = () => WARDROBE;

export const detectGender = (text) => {
  const lower = text.toLowerCase();
  if (/\b(men|man|male|boy|him|guy)\b/.test(lower)) return "m";
  if (/\b(women|woman|female|girl|her|lady)\b/.test(lower)) return "f";
  return "f";
};

const filterByGender = (items, gender) =>
  items.filter((i) => i.gender === gender || i.gender === "unisex" || i.type === "shoes");

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const OCCASION_RULES = {
  work: { tops: ["dress_shirt", "formal", "office"], bottoms: "pants", shoes: "casual" },
  interview: { tops: ["dress_shirt", "formal", "office"], bottoms: "pants", shoes: "casual" },
  coffee: { tops: ["tee", "casual", "tshirt"], bottoms: "pants", shoes: "sneaker" },
  casual: { tops: ["tee", "casual", "tshirt"], bottoms: "pants", shoes: "sneaker" },
  party: { tops: ["dress_shirt", "office", "black"], bottoms: "skirts", shoes: "heel" },
  date: { tops: ["dress_shirt", "office", "formal"], bottoms: "skirts", shoes: "heel" },
  beach: { tops: ["tee", "pastel", "casual"], bottoms: "skirts", shoes: "sneaker" },
  gym: { tops: ["tee"], bottoms: "skirts", shoes: "sneaker" },
  rain: { tops: ["tee", "casual"], bottoms: "pants", shoes: "sneaker" },
  winter: { tops: ["dress_shirt", "formal"], bottoms: "pants", shoes: "sneaker" },
};

const scoreItem = (item, keywords) => {
  const name = item.name.toLowerCase();
  return keywords.some((k) => name.includes(k)) ? 2 : 1;
};

const pickBest = (items, keywords) => {
  if (!items.length) return null;
  const scored = items.map((i) => ({ i, s: scoreItem(i, keywords) }));
  scored.sort((a, b) => b.s - a.s);
  const top = scored.filter((x) => x.s === scored[0].s);
  return pickRandom(top).i;
};

export const pickWardrobeOutfit = (occasion = "casual", gender = "f") => {
  const pool = filterByGender(WARDROBE, gender);
  const rules = OCCASION_RULES[occasion] || OCCASION_RULES.casual;

  const shirts = pool.filter((i) => i.type === "shirt");
  const pants = pool.filter((i) => i.type === "pants");
  const skirts = pool.filter((i) => i.type === "skirts");
  const shoes = pool.filter((i) => i.type === "shoes");

  const top = pickBest(shirts, rules.tops) || pickRandom(shirts);
  const bottomType = rules.bottoms === "skirts" && skirts.length ? "skirts" : "pants";
  const bottomPool = bottomType === "skirts" ? skirts : pants;
  const bottom = pickBest(bottomPool, [bottomType]) || pickRandom(bottomPool);
  const shoe = pickRandom(shoes);

  const items = [top, bottom, shoe].filter(Boolean);
  return { occasion, gender, items };
};

export const formatWardrobeOutfitText = (outfit) => {
  if (!outfit?.items?.length) return "";
  const lines = outfit.items.map((item, idx) => {
    const typeLabel = item.type === "shirt" ? "Top" : item.type === "pants" ? "Bottom" : item.type === "skirts" ? "Skirt" : "Shoes";
    return `${idx + 1}. **${item.name}** (${typeLabel})\n   👗 Wardrobe: ${item.image}\n   🛒 Shop: ${item.shopLink}`;
  });
  return `\n\n---\n👗 **From YOUR wardrobe collection:**\n\n${lines.join("\n\n")}`;
};

export const getWardrobeCatalogForAI = () =>
  WARDROBE.map((i) => `- ${i.name} (${i.type}, ${i.gender}): ${i.image}`).join("\n");
