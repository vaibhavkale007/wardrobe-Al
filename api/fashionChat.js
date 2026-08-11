import {
  detectGender,
  formatWardrobeOutfitText,
  getWardrobeCatalogForAI,
  pickWardrobeOutfit,
} from "./wardrobeCatalog.js";

const FASHION_SYSTEM = `You are Fits AI — a warm, expert fashion stylist chatbot (like Gemini), ONLY for clothing & outfits.

RULES:
- ONLY discuss fashion: outfits, styling, colors, fabrics, occasions, wardrobe.
- Be conversational, remember chat history, ask follow-up questions when helpful.
- When suggesting outfits, you MUST pick items from the user's wardrobe catalog below.
- Reference items by their exact name from the catalog.
- Keep replies 2-3 short paragraphs. Use occasional emojis.

USER'S WARDROBE CATALOG (use these items only):
${getWardrobeCatalogForAI()}`;

const OCCASIONS = {
  coffee: ["coffee date", "cafe", "brunch", "casual meet"],
  work: ["work", "office", "interview", "job", "meeting", "professional", "formal"],
  party: ["party", "night out", "club", "celebration", "birthday", "wedding guest"],
  date: ["date", "dinner", "romantic", "anniversary"],
  beach: ["beach", "vacation", "resort", "tropical", "summer trip"],
  gym: ["gym", "workout", "yoga", "running", "sport", "athletic"],
  rain: ["rain", "rainy", "monsoon", "wet weather"],
  winter: ["winter", "cold", "snow", "layer"],
};

const COLOR_ADVICE = {
  warm: "Warm undertones shine in olive, coral, terracotta, gold, camel, and warm brown.",
  cool: "Cool undertones look great in navy, emerald, true red, silver, lavender, and jewel tones.",
  neutral: "Neutrals work with everything! Build around black, white, grey, beige, and denim.",
};

function detectOccasion(text) {
  const lower = text.toLowerCase();
  for (const [key, keywords] of Object.entries(OCCASIONS)) {
    if (keywords.some((k) => lower.includes(k))) return key;
  }
  if (lower.includes("casual") || lower.includes("everyday") || lower.includes("hangout")) return "casual";
  return null;
}

function detectIntent(text, history) {
  const lower = text.toLowerCase().trim();
  if (/^(hi|hello|hey|good morning|good evening|sup)\b/.test(lower)) return "greeting";
  if (/thank|thanks|thx|appreciate/.test(lower)) return "thanks";
  if (/what (should|can|do) i wear|outfit|what to wear|suggest|recommend|idea|from my wardrobe|my collection/.test(lower)) return "outfit";
  if (/color|colour|undertone|palette|match/.test(lower)) return "color";
  if (/shoes|sneaker|heel|boot|footwear/.test(lower)) return "shoes";
  if (/accessor|jewelry|bag|hat|scarf|belt/.test(lower)) return "accessories";
  if (/weather|hot|cold|summer|winter|rain/.test(lower)) return "weather";
  if (/trend|fashion tip|style tip|how to style/.test(lower)) return "tips";
  if (/(yes|yeah|sure|ok|okay|more|another|else|different)/.test(lower) && history.length > 2) return "followup";
  if (history.length > 2 && lower.split(" ").length <= 8) return "followup";
  return "general";
}

function shouldAttachWardrobe(intent, occasion) {
  return ["outfit", "followup", "shoes", "weather", "general"].includes(intent) && intent !== "greeting";
}

function buildOutfitIntro(occasion, items) {
  const occ = occasion || "casual";
  const names = items.map((i) => i.name).join(", ");
  const intros = {
    work: `For a professional look, I pulled these from your wardrobe: ${names}. This combo is polished and interview-ready.`,
    coffee: `Perfect coffee-date vibe! From your collection: ${names}. Relaxed but put-together.`,
    party: `Party time! Here's a bold look from your wardrobe: ${names}.`,
    date: `Date night sorted! I picked from your closet: ${names}. Romantic and stylish.`,
    beach: `Beach-ready! From your wardrobe: ${names}. Light and breezy.`,
    casual: `Here's a great casual outfit from YOUR wardrobe: ${names}. Easy and stylish.`,
  };
  return intros[occ] || intros.casual;
}

function buildColorResponse(text) {
  const lower = text.toLowerCase();
  let tone = "neutral";
  if (/warm|olive|yellow|peach|golden/.test(lower)) tone = "warm";
  if (/cool|pink|blue|silver|winter/.test(lower)) tone = "cool";
  return `Here's my color guidance:\n\n${COLOR_ADVICE[tone]}\n\nWant me to pick a full outfit from your wardrobe using these colors? Just say the occasion! 🎨`;
}

function buildTipsResponse() {
  const tips = [
    "The 3-color rule: one neutral base, one main color, one accent.",
    "Fit beats brand — tailoring makes any wardrobe piece look premium.",
    "Build a capsule wardrobe where every top matches every bottom.",
  ];
  return `💡 Style tip: ${tips[Math.floor(Math.random() * tips.length)]}\n\nWant me to build an outfit from your wardrobe collection? Tell me the occasion!`;
}

export function generateLocalFashionReply(messages) {
  const history = messages.filter((m) => m.role !== "system");
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  if (!lastUser) return { reply: "Hi! Ask me to pick an outfit from your wardrobe! 👗", wardrobeItems: [] };

  const text = lastUser.content;
  const fullContext = history.map((m) => m.content).join(" ");
  const intent = detectIntent(text, history);
  const occasion = detectOccasion(text) || detectOccasion(fullContext) || "casual";
  const gender = detectGender(fullContext + " " + text);

  let reply = "";
  let wardrobeItems = [];

  switch (intent) {
    case "greeting":
      reply = `Hello! 👋 I'm Fits AI — I style outfits using **your actual wardrobe collection**.\n\nAsk me things like:\n• "Outfit for a coffee date from my wardrobe"\n• "What should I wear to work?"\n• "Party look using my clothes"\n\nI'll pick real items from your closet with links!`;
      break;
    case "thanks":
      reply = `You're welcome! 😊 Want another outfit from your wardrobe? Just tell me the occasion!`;
      break;
    case "color":
      reply = buildColorResponse(text);
      break;
    case "tips":
      reply = buildTipsResponse();
      break;
    case "shoes": {
      const outfit = pickWardrobeOutfit(occasion, gender);
      const shoes = outfit.items.filter((i) => i.type === "shoes");
      wardrobeItems = shoes.length ? shoes : outfit.items;
      reply = `For footwear, from your wardrobe I'd go with **${wardrobeItems[0]?.name || "Classic Sneakers"}**.\n\nThey pair well with casual and semi-formal looks. Want a full outfit suggestion?`;
      reply += formatWardrobeOutfitText({ items: wardrobeItems });
      break;
    }
    default: {
      if (shouldAttachWardrobe(intent, occasion) || intent === "outfit" || intent === "followup") {
        const outfit = pickWardrobeOutfit(occasion, gender);
        wardrobeItems = outfit.items;
        reply = buildOutfitIntro(occasion, outfit.items);
        reply += `\n\nStyling tip: Keep accessories minimal and match your shoe color to your top or bottom for a cohesive look.`;
        reply += formatWardrobeOutfitText(outfit);
      } else {
        reply = `I can pick outfits directly from your wardrobe! Tell me the occasion — work, date, party, casual, beach — and I'll show exact items from your collection with links. 👗`;
      }
    }
  }

  return {
    reply,
    wardrobeItems: wardrobeItems.map((i) => ({
      id: i.id,
      uid: i.uid,
      name: i.name,
      type: i.type,
      gender: i.gender,
      image: i.image,
      link: i.image,
      shopLink: i.shopLink,
    })),
  };
}

export async function generateFashionReply(hf, hfToken, messages) {
  const history = messages.filter((m) => m.role !== "system");
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  const fullContext = history.map((m) => m.content).join(" ");
  const occasion = detectOccasion(lastUser?.content || "") || detectOccasion(fullContext) || "casual";
  const gender = detectGender(fullContext + " " + (lastUser?.content || ""));
  const intent = detectIntent(lastUser?.content || "", history);

  const wardrobeOutfit = pickWardrobeOutfit(occasion, gender);
  const wardrobePayload = wardrobeOutfit.items.map((i) => ({
    id: i.id,
    uid: i.uid,
    name: i.name,
    type: i.type,
    gender: i.gender,
    image: i.image,
    link: i.image,
    shopLink: i.shopLink,
  }));

  const chatMessages = [
    { role: "system", content: FASHION_SYSTEM },
    ...history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-12)
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
  ];

  const models = [
    "meta-llama/Llama-3.2-3B-Instruct",
    "HuggingFaceH4/zephyr-7b-beta",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "Qwen/Qwen2.5-7B-Instruct",
    "google/gemma-2-2b-it",
  ];

  const attachWardrobe =
    intent === "outfit" ||
    intent === "followup" ||
    intent === "shoes" ||
    shouldAttachWardrobe(intent, occasion) ||
    /wardrobe|collection|my clothes|my closet/i.test(lastUser?.content || "");

  if (attachWardrobe) {
    const intro = buildOutfitIntro(occasion, wardrobeOutfit.items);
    let aiReply = null;

    if (hfToken && hf) {
      for (const model of models) {
        try {
          const result = await hf.chatCompletion({
            model,
            messages: chatMessages,
            max_tokens: 400,
            temperature: 0.7,
          });
          const reply = result?.choices?.[0]?.message?.content?.trim();
          if (reply && reply.length > 10) {
            aiReply = reply;
            break;
          }
        } catch {
          // try next model
        }
      }
    }

    return {
      reply: (aiReply || intro) + formatWardrobeOutfitText(wardrobeOutfit),
      wardrobeItems: wardrobePayload,
      source: aiReply ? "huggingface" : "local",
      model: aiReply ? "hf+wardrobe" : "fits-ai-local",
    };
  }

  let aiReply = null;
  if (hfToken && hf) {
    for (const model of models) {
      try {
        const result = await hf.chatCompletion({
          model,
          messages: chatMessages,
          max_tokens: 400,
          temperature: 0.7,
        });
        const reply = result?.choices?.[0]?.message?.content?.trim();
        if (reply && reply.length > 10) {
          aiReply = reply;
          break;
        }
      } catch {
        // try next model
      }
    }
  }

  if (aiReply) {
    return { reply: aiReply, wardrobeItems: [], source: "huggingface", model: "hf" };
  }

  const local = generateLocalFashionReply(messages);
  return { ...local, source: "local", model: "fits-ai-local" };
}
