import {
  Image,
  ImageBackground,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import Modal from "react-native-modal";
import moment from "moment";
import { API_BASE_URL } from "../config/api";
import { getAllClothes } from "../utils/clothes";

type OutfitItem = {
  name: string;
  type?: string;
  image?: string;
  link?: string;
  shopLink?: string;
};

type OutfitSuggestion = {
  id: string;
  source: "wardrobe" | "huggingface";
  title: string;
  badge: string;
  occasion: string;
  style: string;
  description: string;
  userPrompt?: string;
  items: OutfitItem[];
  wardrobeItems?: OutfitItem[];
  image?: string;
  shopLink?: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  accessory: "Accessory",
  shirt: "Top",
  pants: "Bottom",
  skirts: "Bottom",
};

const AIOutfitmaker = () => {
  const route = useRoute();
  const initialQuery = (route.params as { initialQuery?: string })?.initialQuery || "";
  const [query, setQuery] = useState(initialQuery);
  const [extraPrompt, setExtraPrompt] = useState("");
  const [occasion, setOccasion] = useState("none");
  const [customOccasion, setCustomOccasion] = useState("");
  const [outfits, setOutfits] = useState<OutfitSuggestion[]>([]);
  const [userPrompt, setUserPrompt] = useState("");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation<any>();

  const occasions = [
    { label: "Select Occasion", value: "none" },
    { label: "Date", value: "date" },
    { label: "Coffee", value: "coffee" },
    { label: "Interview", value: "interview" },
    { label: "Party", value: "party" },
    { label: "Beach", value: "beach" },
    { label: "Other", value: "other" },
  ];

  const handleSearch = async () => {
    if (!query.trim() && !extraPrompt.trim() && occasion === "none") {
      setError("Please enter a query or select an occasion");
      return;
    }
    if (occasion === "other" && !customOccasion.trim() && !query.trim() && !extraPrompt.trim()) {
      setError("Please describe your occasion or add a prompt");
      return;
    }

    setLoading(true);
    setError("");
    setLiked({});

    try {
      const response = await axios.post(`${API_BASE_URL}/outfit-suggestions`, {
        occasion,
        customOccasion: occasion === "other" ? customOccasion.trim() : "",
        query: query.trim(),
        extraPrompt: extraPrompt.trim(),
      });

      setOutfits(response.data?.outfits || []);
      setUserPrompt(response.data?.userPrompt || "");
    } catch (err: any) {
      console.log("Error fetching outfits", err);
      const is404 = err?.response?.status === 404;
      setError(
        is404
          ? "API not found — restart server: cd api && npm run dev"
          : "Failed to fetch outfits, please try again"
      );
    } finally {
      setLoading(false);
    }
  };

  const selectOccasion = (value: string) => {
    setOccasion(value);
    if (value !== "other") setCustomOccasion("");
    setModalVisible(false);
  };

  const toggleLike = (id: string) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const wearOutfit = (items: OutfitItem[]) => {
    const allClothes = getAllClothes();
    const preselectedIds = items
      .map((item) => allClothes.find((c) => c.image === item.image)?.id)
      .filter(Boolean) as number[];

    navigation.navigate("AddOutfit", {
      date: moment().format("ddd, Do MMM"),
      savedOutfits: {},
      preselectedIds,
    });
  };

  const PromptChip = ({ text }: { text: string }) => (
    <View style={styles.promptChip}>
      <Ionicons name="sparkles" size={14} color="#7c3aed" />
      <Text style={styles.promptChipText} numberOfLines={2}>
        Styled for: {text}
      </Text>
    </View>
  );

  const renderWardrobeItems = (outfit: OutfitSuggestion) => {
    const items = outfit.wardrobeItems || outfit.items;
    return (
      <View style={styles.itemsWrap}>
        <Text style={styles.sectionLabel}>Your wardrobe pieces</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {items.map((item, idx) => (
            <View key={`${item.name}-${idx}`} style={styles.wardrobeCard}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImg} resizeMode="contain" />
              ) : null}
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              {item.type ? (
                <View style={styles.typePill}>
                  <Text style={styles.typePillText}>{TYPE_LABELS[item.type] || item.type}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => wearOutfit(items)}>
          <Ionicons name="shirt-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Wear this outfit</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderShopItems = (outfit: OutfitSuggestion) => (
    <View style={styles.itemsWrap}>
      <Text style={styles.sectionLabel}>Shop these pieces</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
        {outfit.items.map((item, idx) => (
          <View key={`${item.name}-${idx}`} style={styles.shopCard}>
            <Image
              source={{ uri: item.image || "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=400" }}
              style={styles.shopItemImg}
              resizeMode="cover"
            />
            <View style={styles.shopCardBody}>
              <View style={styles.typePillPurple}>
                <Text style={styles.typePillPurpleText}>
                  {TYPE_LABELS[item.type || ""] || item.type || "Item"}
                </Text>
              </View>
              <Text style={styles.shopItemName} numberOfLines={2}>{item.name}</Text>
              {item.shopLink ? (
                <TouchableOpacity
                  style={styles.shopItemBtn}
                  onPress={() => Linking.openURL(item.shopLink!)}
                >
                  <Ionicons name="cart" size={14} color="#fff" />
                  <Text style={styles.shopItemBtnText}>Shop now</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
      {outfit.shopLink ? (
        <TouchableOpacity
          style={styles.shopAllBtn}
          onPress={() => Linking.openURL(outfit.shopLink!)}
        >
          <Ionicons name="bag-handle" size={18} color="#fff" />
          <Text style={styles.shopAllBtnText}>Shop full outfit</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderWardrobeCard = (outfit: OutfitSuggestion, index: number) => {
    const isLiked = liked[outfit.id];
    return (
      <View key={outfit.id} style={[styles.card, styles.cardWardrobe]}>
        <View style={styles.cardTopRow}>
          <View style={[styles.badge, styles.badgeGreen]}>
            <Ionicons name="shirt" size={12} color="#15803d" />
            <Text style={[styles.badgeText, { color: "#15803d" }]}>{outfit.badge}</Text>
          </View>
          <Text style={styles.cardIndex}>#{index + 1}</Text>
        </View>
        <Text style={styles.cardTitle}>{outfit.title}</Text>
        {outfit.userPrompt ? <PromptChip text={outfit.userPrompt} /> : null}
        <Text style={styles.cardDesc}>{outfit.description}</Text>
        {renderWardrobeItems(outfit)}
        <TouchableOpacity
          style={[styles.likeBtn, isLiked && styles.likeBtnActive]}
          onPress={() => toggleLike(outfit.id)}
        >
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={18} color={isLiked ? "#ef4444" : "#6b7280"} />
          <Text style={[styles.likeBtnText, isLiked && { color: "#ef4444" }]}>
            {isLiked ? "Saved" : "Save look"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderShopCard = (outfit: OutfitSuggestion, index: number) => {
    const isLiked = liked[outfit.id];
    return (
      <View key={outfit.id} style={[styles.card, styles.cardShop]}>
        {outfit.image ? (
          <ImageBackground source={{ uri: outfit.image }} style={styles.heroImg} imageStyle={styles.heroImgInner}>
            <View style={styles.heroOverlay}>
              <View style={styles.heroBadge}>
                <Ionicons name="cart" size={12} color="#fff" />
                <Text style={styles.heroBadgeText}>{outfit.badge}</Text>
              </View>
              <Text style={styles.heroStyle}>{outfit.style}</Text>
              <Text style={styles.heroTitle}>{outfit.title}</Text>
            </View>
          </ImageBackground>
        ) : null}

        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardIndex}>#{index + 1}</Text>
            <Text style={styles.occasionTag}>{outfit.occasion}</Text>
          </View>

          {outfit.userPrompt ? <PromptChip text={outfit.userPrompt} /> : null}
          <Text style={styles.cardDesc}>{outfit.description}</Text>
          {renderShopItems(outfit)}

          <TouchableOpacity
            style={[styles.likeBtn, isLiked && styles.likeBtnActive]}
            onPress={() => toggleLike(outfit.id)}
          >
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={18} color={isLiked ? "#ef4444" : "#6b7280"} />
            <Text style={[styles.likeBtnText, isLiked && { color: "#ef4444" }]}>
              {isLiked ? "Saved" : "Save look"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const searchPreview = [
    occasion !== "none" && occasion !== "other" ? occasion : "",
    occasion === "other" ? customOccasion : "",
    query,
    extraPrompt,
  ]
    .filter(Boolean)
    .join(" • ");

  const wardrobeOutfit = outfits.find((o) => o.source === "wardrobe");
  const shopOutfits = outfits.filter((o) => o.source !== "wardrobe");

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Outfit Suggestions</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.stylistRow}>
          <Image
            source={{ uri: "https://images.pexels.com/photos/19501169/pexels-photo-19501169.jpeg" }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.stylistName}>Eli</Text>
            <Text style={styles.stylistSub}>AI Stylist • Shop + Wardrobe</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Outfit Request</Text>

          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.inputRow}>
            <Ionicons name="briefcase-outline" size={22} color="#374151" />
            <Text style={styles.inputRowText}>
              {occasions.find((o) => o.value === occasion)?.label || "Select Occasion"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#9ca3af" />
          </TouchableOpacity>

          {occasion === "other" && (
            <View style={styles.inputRow}>
              <Ionicons name="create-outline" size={22} color="#374151" />
              <TextInput
                placeholder="Describe your occasion (e.g. wedding guest)"
                value={customOccasion}
                onChangeText={setCustomOccasion}
                style={styles.textInput}
              />
            </View>
          )}

          <View style={styles.inputRow}>
            <Ionicons name="shirt-outline" size={22} color="#374151" />
            <TextInput
              placeholder="E.g. first date dinner, casual vibe"
              value={query}
              onChangeText={setQuery}
              style={styles.textInput}
            />
          </View>

          <Text style={styles.fieldLabel}>Additional Prompt</Text>
          <TextInput
            placeholder="Add more details (colors, style, budget...)"
            value={extraPrompt}
            onChangeText={setExtraPrompt}
            style={styles.textArea}
            multiline
            maxLength={200}
          />

          {searchPreview ? (
            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Your request</Text>
              <Text style={styles.previewText}>{searchPreview}</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.makeBtn} disabled={loading} onPress={handleSearch}>
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.makeBtnText}>
              {loading ? "Creating outfits..." : "Make Outfits"}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Picking from wardrobe + shopping picks for your prompt...</Text>
        ) : null}

        {!loading && outfits.length > 0 ? (
          <View style={styles.resultsWrap}>
            {userPrompt ? (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>Your 3 outfit picks</Text>
                <Text style={styles.resultsSub}>
                  Based on: <Text style={styles.resultsPrompt}>{userPrompt}</Text>
                </Text>
              </View>
            ) : null}

            {wardrobeOutfit ? (
              <View style={styles.resultSection}>
                <Text style={styles.resultSectionTitle}>From your collection</Text>
                {renderWardrobeCard(wardrobeOutfit, 0)}
              </View>
            ) : null}

            {shopOutfits.length > 0 ? (
              <View style={styles.resultSection}>
                <Text style={styles.resultSectionTitle}>Shop online for your prompt</Text>
                <Text style={styles.resultSectionSub}>
                  AI-curated looks with shopping links matching your request
                </Text>
                {shopOutfits.map((outfit, i) => renderShopCard(outfit, i + 1))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={{ justifyContent: "flex-end", margin: 0 }}
        backdropColor="black"
        backdropOpacity={0.4}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select Occasion</Text>
          {occasions.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.modalItem, occasion === item.value && styles.modalItemActive]}
              onPress={() => selectOccasion(item.value)}
            >
              <Text style={[styles.modalItemText, occasion === item.value && styles.modalItemTextActive]}>
                {item.label}
              </Text>
              {occasion === item.value ? <Ionicons name="checkmark" size={20} color="#6366f1" /> : null}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AIOutfitmaker;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8f9fb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  scrollContent: { paddingBottom: 40 },
  stylistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  stylistName: { fontSize: 18, fontWeight: "700", color: "#111" },
  stylistSub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  formCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  formTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 14 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  inputRowText: { flex: 1, fontSize: 15, color: "#111" },
  textInput: { flex: 1, fontSize: 15, color: "#111", padding: 0 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginTop: 16, marginBottom: 8 },
  textArea: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#111",
    minHeight: 80,
    textAlignVertical: "top",
    backgroundColor: "#fafafa",
  },
  previewBox: {
    marginTop: 14,
    backgroundColor: "#f5f3ff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ede9fe",
  },
  previewLabel: { fontSize: 11, fontWeight: "700", color: "#7c3aed", textTransform: "uppercase", marginBottom: 4 },
  previewText: { fontSize: 14, color: "#4c1d95", lineHeight: 20 },
  errorText: { color: "#ef4444", marginTop: 12, fontSize: 14 },
  makeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#111",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 18,
  },
  makeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  loadingText: { textAlign: "center", color: "#6b7280", marginVertical: 20, fontSize: 14 },
  resultsWrap: { paddingHorizontal: 16 },
  resultsHeader: { marginBottom: 16 },
  resultsTitle: { fontSize: 20, fontWeight: "800", color: "#111" },
  resultsSub: { fontSize: 14, color: "#6b7280", marginTop: 4, lineHeight: 20 },
  resultsPrompt: { color: "#7c3aed", fontWeight: "600" },
  resultSection: { marginBottom: 24 },
  resultSectionTitle: { fontSize: 17, fontWeight: "700", color: "#111", marginBottom: 4 },
  resultSectionSub: { fontSize: 13, color: "#6b7280", marginBottom: 14 },
  card: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardWardrobe: { borderWidth: 1, borderColor: "#bbf7d0", padding: 16 },
  cardShop: { borderWidth: 1, borderColor: "#ddd6fe" },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeGreen: { backgroundColor: "#dcfce7" },
  badgeText: { fontSize: 12, fontWeight: "700" },
  cardIndex: { fontSize: 13, color: "#9ca3af", fontWeight: "700" },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#111", marginBottom: 8 },
  cardBody: { padding: 16 },
  cardDesc: { fontSize: 14, color: "#4b5563", lineHeight: 21, marginBottom: 12 },
  promptChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f5f3ff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ede9fe",
  },
  promptChipText: { flex: 1, fontSize: 13, color: "#5b21b6", fontWeight: "500" },
  heroImg: { width: "100%", height: 200 },
  heroImgInner: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  heroOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(99,102,241,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  heroBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  heroStyle: { color: "#e9d5ff", fontSize: 13, fontWeight: "600", textTransform: "uppercase" },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  occasionTag: {
    fontSize: 12,
    color: "#7c3aed",
    fontWeight: "600",
    textTransform: "capitalize",
    backgroundColor: "#f5f3ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  itemsWrap: { marginTop: 4 },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 10 },
  hScroll: { paddingRight: 8 },
  wardrobeCard: {
    width: 130,
    marginRight: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  itemImg: { width: "100%", height: 100, borderRadius: 10, backgroundColor: "#fff" },
  itemName: { fontSize: 12, fontWeight: "600", color: "#111", marginTop: 8 },
  typePill: {
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  typePillText: { fontSize: 10, color: "#15803d", fontWeight: "700", textTransform: "capitalize" },
  shopCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  shopItemImg: { width: "100%", height: 110, backgroundColor: "#f3f4f6" },
  shopCardBody: { padding: 10 },
  typePillPurple: {
    alignSelf: "flex-start",
    backgroundColor: "#ede9fe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  typePillPurpleText: { fontSize: 10, color: "#6d28d9", fontWeight: "700" },
  shopItemName: { fontSize: 12, fontWeight: "600", color: "#111", minHeight: 32, marginBottom: 8 },
  shopItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#6366f1",
    paddingVertical: 8,
    borderRadius: 10,
  },
  shopItemBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#111",
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 14,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  shopAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#7c3aed",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 14,
  },
  shopAllBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  likeBtnActive: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  likeBtnText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 12, color: "#111" },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalItemActive: { backgroundColor: "#f5f3ff", marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 10 },
  modalItemText: { fontSize: 16, color: "#374151" },
  modalItemTextActive: { color: "#6366f1", fontWeight: "700" },
});
