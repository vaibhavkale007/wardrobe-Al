import {
  detectGender,
  pickWardrobeOutfit,
} from "./wardrobeCatalog.js";

const shopSearch = (query) =>
  `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;

const OCCASION_MAP = {
  date: "date",
  coffee: "coffee",
  interview: "work",
  party: "party",
  beach: "beach",
  other: "casual",
  none: "casual",
};

const ITEM_TYPE_IMAGES = {
  top: "https://images.pexels.com/photos/7671166/pexels-photo-7671166.jpeg?auto=compress&cs=tinysrgb&w=400",
  bottom: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400",
  shoes: "https://images.pexels.com/photos/19090/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400",
  accessory: "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400",
  default: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=400",
};

const AI_INSPIRATION_IMAGES = {
  date: [
    "https://i.pinimg.com/736x/b2/6e/c7/b26ec7bc30ca9459b918ae8f7bf66305.jpg",
    "https://i.pinimg.com/736x/8c/61/12/8c6112457ae46fa1e0aea8b8f5ed18ec.jpg",
  ],
  coffee: [
    "https://i.pinimg.com/736x/d7/2d/26/d72d268ca4ff150db1db560b25afb843.jpg",
    "https://i.pinimg.com/736x/b2/6e/c7/b26ec7bc30ca9459b918ae8f7bf66305.jpg",
  ],
  work: [
    "https://i.pinimg.com/736x/50/83/0e/50830e372ee844c1f429b8ef89e26fd1.jpg",
    "https://i.pinimg.com/736x/8c/61/12/8c6112457ae46fa1e0aea8b8f5ed18ec.jpg",
  ],
  party: [
    "https://i.pinimg.com/736x/8c/61/12/8c6112457ae46fa1e0aea8b8f5ed18ec.jpg",
    "https://i.pinimg.com/736x/b2/6e/c7/b26ec7bc30ca9459b918ae8f7bf66305.jpg",
  ],
  beach: [
    "https://i.pinimg.com/736x/d7/2d/26/d72d268ca4ff150db1db560b25afb843.jpg",
    "https://i.pinimg.com/736x/c2/78/95/c2789530a2dc8c9dbfd4aa5e2e70d608.jpg",
  ],
  casual: [
    "https://i.pinimg.com/736x/b2/6e/c7/b26ec7bc30ca9459b918ae8f7bf66305.jpg",
    "https://i.pinimg.com/736x/d7/2d/26/d72d268ca4ff150db1db560b25afb843.jpg",
  ],
};

const AI_TEMPLATES = {
  date: [
    { style: "Romantic", items: ["Silk wrap blouse", "Midi pleated skirt", "Strappy heeled sandals"] },
    { style: "Modern Chic", items: ["Fitted turtleneck", "High-waist trousers", "Ankle boots"] },
  ],
  coffee: [
    { style: "Relaxed", items: ["Linen button-down shirt", "Straight-leg jeans", "White canvas sneakers"] },
    { style: "Soft Casual", items: ["Cropped knit sweater", "Wide-leg chinos", "Loafers"] },
  ],
  work: [
    { style: "Professional", items: ["Structured blazer", "Tailored ankle pants", "Pointed toe flats"] },
    { style: "Smart Formal", items: ["Crisp dress shirt", "Pencil skirt", "Low block heels"] },
  ],
  party: [
    { style: "Glam", items: ["Sequin crop top", "Wide palazzo pants", "Platform heels"] },
    { style: "Night Out", items: ["Satin slip top", "Leather mini skirt", "Statement heels"] },
  ],
  beach: [
    { style: "Breezy", items: ["Linen tank top", "Flowy maxi skirt", "Flat leather sandals"] },
    { style: "Vacation", items: ["Off-shoulder blouse", "High-waist shorts", "Espadrille wedges"] },
  ],
  casual: [
    { style: "Everyday", items: ["Classic crew-neck tee", "Relaxed-fit jeans", "Clean sneakers"] },
    { style: "Weekend", items: ["Oversized sweatshirt", "Biker shorts", "Chunky trainers"] },
  ],
};

function detectItemType(name, index) {
  const lower = name.toLowerCase();
  if (/shoe|sneaker|heel|boot|sandal|loafer|flat|pump|trainer/.test(lower)) return "shoes";
  if (/pant|jean|trouser|skirt|short|legging|chino/.test(lower)) return "bottom";
  if (/necklace|bag|belt|watch|earring|scarf|hat/.test(lower)) return "accessory";
  if (/shirt|blouse|top|tee|sweater|blazer|jacket|gown|dress|tank|crop/.test(lower)) return "top";
  const order = ["top", "bottom", "shoes"];
  return order[index] || "default";
}

function buildUserPrompt(occasion, customOccasion, query, extraPrompt) {
  const parts = [];
  if (occasion && occasion !== "none" && occasion !== "other") {
    parts.push(occasion);
  }
  if (customOccasion?.trim()) parts.push(customOccasion.trim());
  if (query?.trim()) parts.push(query.trim());
  if (extraPrompt?.trim()) parts.push(extraPrompt.trim());
  return parts.join(" • ") || "casual outfit";
}

function resolveOccasion(occasion, customOccasion, query, extraPrompt) {
  if (occasion === "other" && customOccasion?.trim()) {
    const text = customOccasion.toLowerCase();
    if (/interview|work|office|job/.test(text)) return "work";
    if (/party|club|night/.test(text)) return "party";
    if (/beach|vacation|summer/.test(text)) return "beach";
    if (/date|dinner|romantic/.test(text)) return "date";
    if (/coffee|cafe|brunch/.test(text)) return "coffee";
    return "casual";
  }
  return OCCASION_MAP[occasion] || "casual";
}

function buildWardrobeCard(wardrobeOutfit, userPrompt) {
  const items = wardrobeOutfit.items.map((i) => ({
    name: i.name,
    type: i.type,
    image: i.image,
    link: i.image,
    shopLink: i.shopLink,
  }));

  return {
    id: `wardrobe-${Date.now()}`,
    source: "wardrobe",
    title: "From Your Collection",
    badge: "Your Wardrobe",
    occasion: wardrobeOutfit.occasion,
    style: "Your closet",
    userPrompt,
    description: `Picked from your wardrobe for: ${userPrompt}`,
    items,
    wardrobeItems: items,
    image: items[0]?.image,
    shopLink: null,
  };
}

function itemsWithShopLinks(itemNames, userPrompt) {
  return itemNames.map((name, index) => {
    const type = detectItemType(name, index);
    return {
      name,
      type,
      image: ITEM_TYPE_IMAGES[type] || ITEM_TYPE_IMAGES.default,
      shopLink: shopSearch(`${name} ${userPrompt} buy online`),
    };
  });
}

function buildAiCard(template, occasion, index, userPrompt) {
  const images = AI_INSPIRATION_IMAGES[occasion] || AI_INSPIRATION_IMAGES.casual;
  const items = itemsWithShopLinks(template.items, userPrompt);
  const outfitShopQuery = `${userPrompt} ${template.items.join(" ")}`;

  return {
    id: `ai-${index}-${Date.now()}`,
    source: "huggingface",
    title: `Shop Look ${index}`,
    badge: "Shop Online",
    occasion,
    style: template.style,
    userPrompt,
    description: `${template.style} outfit styled for your request: "${userPrompt}"`,
    items,
    image: images[(index - 1) % images.length],
    shopLink: shopSearch(`${outfitShopQuery} outfit set`),
  };
}

function parseHfOutfits(text, occasion, userPrompt) {
  const outfits = [];
  const blocks = text.split(/OUTFIT\s*\d+/i).filter((b) => b.trim().length > 10);

  blocks.forEach((block, idx) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const styleLine = lines.find((l) => /^style:/i.test(l));
    const style = styleLine ? styleLine.replace(/^style:\s*/i, "") : "AI Curated";
    const itemLines = lines
      .filter((l) => l.startsWith("-") || l.startsWith("•"))
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .filter((l) => l.length > 2);

    if (itemLines.length >= 2) {
      outfits.push(
        buildAiCard({ style, items: itemLines.slice(0, 4) }, occasion, idx + 1, userPrompt)
      );
    }
  });

  return outfits;
}

async function generateHfOutfits(hf, hfToken, occasion, userPrompt, customOccasion) {
  const prompt = `You are a fashion stylist. The user wants outfit ideas to shop online.

User's full request: "${userPrompt}"
Occasion: ${occasion}
${customOccasion ? `Custom occasion: ${customOccasion}` : ""}

Suggest exactly 2 DIFFERENT outfits that match the user's request above.
Each outfit must have 3 clothing items (top, bottom, shoes).

Format EXACTLY like this:
OUTFIT 1:
- top item name
- bottom item name
- shoes name
Style: one word style
OUTFIT 2:
- top item name
- bottom item name
- shoes name
Style: one word style`;

  const models = [
    "meta-llama/Llama-3.2-3B-Instruct",
    "HuggingFaceH4/zephyr-7b-beta",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "Qwen/Qwen2.5-7B-Instruct",
  ];

  for (const model of models) {
    try {
      const result = await hf.chatCompletion({
        model,
        messages: [
          { role: "system", content: "You are a fashion stylist. Suggest shop-able clothing outfits matching the user's exact request." },
          { role: "user", content: prompt },
        ],
        max_tokens: 400,
        temperature: 0.75,
      });
      const text = result?.choices?.[0]?.message?.content?.trim();
      if (text) {
        const parsed = parseHfOutfits(text, occasion, userPrompt);
        if (parsed.length >= 1) return parsed.slice(0, 2);
      }
    } catch {
      // try next model
    }
  }
  return [];
}

function getTemplateOutfits(occasion, userPrompt, count = 2) {
  const templates = AI_TEMPLATES[occasion] || AI_TEMPLATES.casual;
  return templates.slice(0, count).map((t, i) => buildAiCard(t, occasion, i + 1, userPrompt));
}

export async function generateOutfitSuggestions(hf, hfToken, { occasion, customOccasion, query, extraPrompt }) {
  const resolved = resolveOccasion(occasion, customOccasion, query, extraPrompt);
  const userPrompt = buildUserPrompt(occasion, customOccasion, query, extraPrompt);
  const gender = detectGender(`${query} ${extraPrompt} ${customOccasion || ""}`);

  const wardrobeOutfit = pickWardrobeOutfit(resolved, gender);
  const wardrobeCard = buildWardrobeCard(wardrobeOutfit, userPrompt);

  let aiOutfits = [];
  if (hfToken && hf) {
    aiOutfits = await generateHfOutfits(hf, hfToken, resolved, userPrompt, customOccasion);
  }

  if (aiOutfits.length < 2) {
    const templates = getTemplateOutfits(resolved, userPrompt, 2);
    aiOutfits = [...aiOutfits, ...templates].slice(0, 2);
  }

  return {
    outfits: [wardrobeCard, ...aiOutfits.slice(0, 2)],
    occasion: resolved,
    userPrompt,
    query: userPrompt,
  };
}
