import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import { HfInference } from "@huggingface/inference";
import cosineSimilarity from "compute-cosine-similarity";
import User from "./models/user.js";
import SavedOutfit from "./models/savedoutfit.js";
import Outfit from "./models/outfit.js";
import { generateFashionReply } from "./fashionChat.js";
import { generateOutfitSuggestions } from "./outfitMaker.js";

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "965de78b929b09f4693a231ab5934a910ea823d96d6ff5e33a4b18ed2c9c1f09";

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, fashionChat: true });
});

// 🧠 Hugging Face Setup
const hfToken = process.env.HF_TOKEN || "";
const hf = new HfInference(hfToken);

// 🔐 Token Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = decoded;
    next();
  });
};

// ✅ MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/wardrobe";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to Local MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

// 👤 User Registration
app.post("/register", async (req, res) => {
  try {
    const { email, password, username, gender, profileImage } = req.body;

    if (await User.findOne({ email }))
      return res.status(400).json({ error: "Email already exists" });

    if (await User.findOne({ username }))
      return res.status(400).json({ error: "Username already exists" });

    const user = new User({
      email,
      password,
      username,
      gender,
      profileImage,
      outfits: [],
    });

    await user.save();
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔐 Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👤 Get Logged-in User
app.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✏️ Update Profile
app.put("/me", authenticateToken, async (req, res) => {
  try {
    const { username, gender, profileImage } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) return res.status(400).json({ error: "Username already taken" });
      user.username = username;
    }
    if (gender !== undefined) user.gender = gender;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();
    const updated = await User.findById(user._id).select("-password");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const parseOutfitItems = (items) =>
  items
    ?.map((item) => {
      if (!item?.image?.match(/^(https?:\/\/|file:\/\/|data:|blob:)/)) return null;
      return {
        id: item.id || null,
        type: item.type || "shirt",
        image: item.image,
        x: item.x || 0,
        y: item.y || 0,
      };
    })
    .filter(Boolean);

// 👕 Save Outfit (creates or updates by date)
app.post("/save-outfit", authenticateToken, async (req, res) => {
  try {
    const { date, items, caption, occasion, visibility, isOotd } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const validItems = parseOutfitItems(items);
    if (validItems.length === 0)
      return res.status(400).json({ error: "No valid items provided" });

    const existing = await SavedOutfit.findOne({ userId, date });
    if (existing) {
      existing.items = validItems;
      if (caption !== undefined) existing.caption = caption;
      if (occasion !== undefined) existing.occasion = occasion;
      if (visibility !== undefined) existing.visibility = visibility;
      if (isOotd !== undefined) existing.isOotd = isOotd;
      await existing.save();
      return res.status(200).json({ outfit: existing });
    }

    const newOutfit = new SavedOutfit({
      userId,
      date,
      items: validItems,
      caption: caption || "",
      occasion: occasion || "",
      visibility: visibility || "Everyone",
      isOotd: isOotd || false,
    });

    await newOutfit.save();
    user.outfits.push(newOutfit._id);
    await user.save();

    res.status(201).json({ outfit: newOutfit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✏️ Update Outfit by ID
app.put("/save-outfit/:outfitId", authenticateToken, async (req, res) => {
  try {
    const { items, caption, occasion, visibility, isOotd, date } = req.body;
    const outfit = await SavedOutfit.findById(req.params.outfitId);
    if (!outfit) return res.status(404).json({ error: "Outfit not found" });
    if (outfit.userId.toString() !== req.user.id)
      return res.status(403).json({ error: "Unauthorized" });

    if (items) {
      const validItems = parseOutfitItems(items);
      if (validItems.length === 0)
        return res.status(400).json({ error: "No valid items provided" });
      outfit.items = validItems;
    }
    if (caption !== undefined) outfit.caption = caption;
    if (occasion !== undefined) outfit.occasion = occasion;
    if (visibility !== undefined) outfit.visibility = visibility;
    if (isOotd !== undefined) outfit.isOotd = isOotd;
    if (date !== undefined) outfit.date = date;

    await outfit.save();
    res.json({ outfit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👗 Get User Outfits
app.get("/save-outfit/user/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.id !== userId)
      return res.status(403).json({ error: "Unauthorized access" });

    const user = await User.findById(userId).populate("outfits");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user.outfits.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ Delete Outfit by Date (must be before /:outfitId)
app.delete("/save-outfit/by-date/:date", authenticateToken, async (req, res) => {
  try {
    const date = decodeURIComponent(req.params.date);
    const outfit = await SavedOutfit.findOne({ userId: req.user.id, date });
    if (!outfit) return res.status(404).json({ error: "Outfit not found" });

    await User.findByIdAndUpdate(req.user.id, { $pull: { outfits: outfit._id } });
    await SavedOutfit.findByIdAndDelete(outfit._id);
    res.json({ success: true, date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ Delete Outfit by ID
app.delete("/save-outfit/:outfitId", authenticateToken, async (req, res) => {
  try {
    const outfit = await SavedOutfit.findById(req.params.outfitId);
    if (!outfit) return res.status(404).json({ error: "Outfit not found" });
    if (outfit.userId.toString() !== req.user.id)
      return res.status(403).json({ error: "Unauthorized" });

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { outfits: outfit._id },
    });
    await SavedOutfit.findByIdAndDelete(req.params.outfitId);
    res.json({ success: true, date: outfit.date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 💬 Fashion AI Chat (Hugging Face + smart local fallback)
app.post("/fashion-chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages?.length) {
      return res.status(400).json({ error: "Messages array required" });
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser?.content?.trim()) {
      return res.status(400).json({ error: "Last user message is empty" });
    }

    const result = await generateFashionReply(hf, hfToken, messages);
    res.json({
      reply: result.reply,
      wardrobeItems: result.wardrobeItems || [],
      source: result.source,
      model: result.model,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👗 AI Outfit Maker — 1 wardrobe + 2 AI suggestions with shop links
app.post("/outfit-suggestions", async (req, res) => {
  try {
    const { occasion, customOccasion, query, extraPrompt } = req.body;
    if (occasion === "none" && !query?.trim() && !extraPrompt?.trim() && !customOccasion?.trim()) {
      return res.status(400).json({ error: "Select an occasion or enter a prompt" });
    }
    const result = await generateOutfitSuggestions(hf, hfToken, {
      occasion: occasion || "none",
      customOccasion: customOccasion || "",
      query: query || "",
      extraPrompt: extraPrompt || "",
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🧠 Smart Outfit Suggestion (Semantic Search)
const generateEmbedding = async (text) => {
  if (!hfToken) throw new Error("HF token not configured");
  return await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });
};

const normalizeQuery = (query) => {
  const synonyms = {
    "coffee date": "coffee date",
    "dinner date": "date",
    "job interview": "interview",
    work: "interview",
    casual: "casual",
    formal: "formal",
    outfit: "",
    "give me": "",
    a: "",
    an: "",
    for: "",
  };

  let normalized = query.toLowerCase();
  Object.keys(synonyms).forEach((key) => {
    normalized = normalized.replace(new RegExp(`\\b${key}\\b`, "gi"), synonyms[key]);
  });
  return [...new Set(normalized.trim().split(/\s+/).filter(Boolean))].join(" ");
};

app.get("/smart-search", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Query required" });

  try {
    const normalizedQuery = normalizeQuery(query);
    const outfits = await Outfit.find();

    let queryEmbedding = null;
    if (hfToken) {
      try {
        queryEmbedding = await generateEmbedding(normalizedQuery);
      } catch {
        queryEmbedding = null;
      }
    }

    const MIN_SIMILARITY = query.length > 20 ? 0.3 : 0.4;

    let scored = [];
    if (queryEmbedding) {
      scored = outfits
        .filter((o) => Array.isArray(o.embedding) && o.embedding.length > 0)
        .map((o) => ({ ...o.toObject(), score: cosineSimilarity(queryEmbedding, o.embedding) }))
        .filter((o) => o.score >= MIN_SIMILARITY)
        .sort((a, b) => b.score - a.score);
    }

    if (scored.length === 0) {
      const queryTerms = normalizedQuery.split(" ");
      scored = outfits.filter((o) =>
        queryTerms.some(
          (term) =>
            o.occasion.toLowerCase().includes(term) ||
            o.style.toLowerCase().includes(term) ||
            o.items.some((item) => item.toLowerCase().includes(term))
        )
      );
    }

    res.json(scored.slice(0, 5));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🧩 Seed Default Outfits (Runs Once)
const seedData = async () => {
  try {
    const count = await Outfit.countDocuments();
    if (count === 0) {
      const outfits = [
        {
          occasion: "date",
          style: "casual",
          items: ["White linen shirt", "Dark jeans", "Loafers"],
          image: "https://i.pinimg.com/736x/b2/6e/c7/b26ec7bc30ca9459b918ae8f7bf66305.jpg",
        },
        {
          occasion: "date",
          style: "elegant",
          items: ["White flared pants", "sandals", "sunglasses"],
          image: "https://i.pinimg.com/736x/8c/61/12/8c6112457ae46fa1e0aea8b8f5ed18ec.jpg",
        },
        {
          occasion: "coffee",
          style: "casual",
          items: ["cropped t-shirt", "wide-leg beige trousers", "Samba sneakers"],
          image: "https://i.pinimg.com/736x/d7/2d/26/d72d268ca4ff150db1db560b25afb843.jpg",
        },
      ];

      for (const outfit of outfits) {
        const text = `${outfit.occasion} ${outfit.style} ${outfit.items.join(", ")}`;
        try {
          const embedding = hfToken ? await generateEmbedding(text) : [];
          await new Outfit({ ...outfit, embedding }).save();
        } catch {
          await new Outfit({ ...outfit }).save();
        }
      }

      console.log("✅ Database seeded with sample outfits");
    } else {
      console.log("✅ Database already contains", count, "outfits");
    }
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
  }
};

// 🚀 Start Server
connectDB().then(() => {
  seedData();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log("✅ Routes: /fashion-chat, /smart-search, /save-outfit, ...");
  });
});