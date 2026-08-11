import {
  Alert,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import TintedClothingImage from "../components/TintedClothingImage";
import { ClothingItem, getMergedClothes } from "../utils/clothes";
import { generateClothName } from "../utils/colorNames";
import {
  COLOR_OPTIONS,
  ColorOption,
  ColorResult,
  getShopReferenceImage,
  resolveColorResult,
} from "../utils/colorAnalysis";
import { useWardrobeStore } from "../store/wardrobeStore";

const CATEGORIES = [
  { key: "shirt", label: "Shirts", icon: "shirt-outline" as const },
  { key: "pants", label: "Pants", icon: "body-outline" as const },
  { key: "shoes", label: "Shoes", icon: "footsteps-outline" as const },
];

const TYPE_LABEL: Record<string, string> = {
  shirt: "Shirt",
  pants: "Pants",
  shoes: "Shoes",
  skirts: "Skirt",
};

const ColorAnalysisScreen = () => {
  const navigation = useNavigation();
  const addCustomCloth = useWardrobeStore((s) => s.addCustomCloth);
  const customClothes = useWardrobeStore((s) => s.customClothes);

  const [category, setCategory] = useState("shirt");
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [colorResult, setColorResult] = useState<ColorResult | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [generatedName, setGeneratedName] = useState("");

  const filteredItems = useMemo(() => {
    return getMergedClothes().filter((item) => {
      if (category === "shirt") return item.type === "shirt";
      if (category === "pants") return item.type === "pants" || item.type === "skirts";
      return item.type === "shoes";
    });
  }, [category, customClothes.length]);

  const handleSelectItem = (item: ClothingItem) => {
    setSelectedItem(item);
    setSelectedColor(null);
    setColorResult(null);
    setShowAddModal(false);
  };

  const handleSelectColor = (color: ColorOption) => {
    if (!selectedItem) {
      Alert.alert("Select clothing", "Pick a shirt, pants, or shoes first.");
      return;
    }
    const result = resolveColorResult(selectedItem, color);
    setSelectedColor(color);
    setColorResult(result);
    setGeneratedName(
      result.wardrobeItem?.name || generateClothName(selectedItem.type, color.name)
    );
    setShowAddModal(true);
  };

  const handleAddToWardrobe = async () => {
    if (!selectedItem || !selectedColor || colorResult?.inWardrobe) return;
    await addCustomCloth({
      image: selectedItem.image,
      type: selectedItem.type,
      gender: selectedItem.gender,
      name: generatedName,
      color: selectedColor.hex,
      colorName: selectedColor.name,
    });
    setShowAddModal(false);
    Alert.alert("Added!", `"${generatedName}" is now in your wardrobe.`);
    setColorResult(resolveColorResult(selectedItem, selectedColor));
  };

  const previewImage = colorResult?.displayImage || selectedItem?.image;
  const previewColor = colorResult?.displayColor || selectedColor?.hex;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Color Analysis</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Recolor your clothes</Text>
        <Text style={styles.subtitle}>
          Select your cloth, pick a color — the garment changes color. If that color isn't in your
          wardrobe yet, we'll show a shop link.
        </Text>

        <View style={styles.tabs}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.tab, category === cat.key && styles.tabActive]}
              onPress={() => {
                setCategory(cat.key);
                setSelectedItem(null);
                setSelectedColor(null);
                setColorResult(null);
              }}
            >
              <Ionicons
                name={cat.icon}
                size={18}
                color={category === cat.key ? "#fff" : "#6b7280"}
              />
              <Text style={[styles.tabText, category === cat.key && styles.tabTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>1. Select clothing</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemScroll}>
          {filteredItems.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            return (
              <TouchableOpacity
                key={String(item.id)}
                style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                onPress={() => handleSelectItem(item)}
              >
                <TintedClothingImage
                  uri={item.image}
                  color={item.color && isSelected ? item.color : null}
                  style={styles.itemImgWrap}
                />
                <Text style={styles.itemType} numberOfLines={1}>
                  {item.name || TYPE_LABEL[item.type] || item.type}
                </Text>
                {item.colorName ? (
                  <Text style={styles.itemColorTag}>{item.colorName}</Text>
                ) : null}
                {isSelected ? (
                  <View style={styles.selectedDot}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.previewBox}>
          <Text style={styles.sectionLabel}>2. Preview</Text>
          {selectedItem ? (
            <View style={styles.previewInner}>
              <View style={styles.previewImgFrame}>
                <TintedClothingImage
                  uri={previewImage || selectedItem.image}
                  color={previewColor}
                  style={styles.previewImg}
                  recolorGarment
                />
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewType}>
                  {TYPE_LABEL[selectedItem.type] || selectedItem.type}
                </Text>
                {selectedColor ? (
                  <>
                    <View style={styles.colorRow}>
                      <View style={[styles.colorDot, { backgroundColor: selectedColor.hex }]} />
                      <Text style={styles.colorNameText}>{selectedColor.name}</Text>
                    </View>
                    {colorResult?.inWardrobe ? (
                      <View style={styles.wardrobeBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#15803d" />
                        <Text style={styles.wardrobeBadgeText}>In your wardrobe</Text>
                      </View>
                    ) : colorResult ? (
                      <View style={styles.shopBadge}>
                        <Ionicons name="cart-outline" size={14} color="#7c3aed" />
                        <Text style={styles.shopBadgeText}>Not in collection — shop below</Text>
                      </View>
                    ) : null}
                    <Text style={styles.previewName}>{generatedName}</Text>
                  </>
                ) : (
                  <Text style={styles.previewHint}>Tap a color to change this garment's color</Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.previewEmpty}>
              <Ionicons name="color-palette-outline" size={40} color="#d1d5db" />
              <Text style={styles.previewEmptyText}>Select a clothing item above</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionLabel}>3. Pick a color</Text>
        <View style={styles.colorGrid}>
          {COLOR_OPTIONS.map((color) => {
            const isActive = selectedColor?.hex === color.hex;
            return (
              <TouchableOpacity
                key={color.hex}
                style={[styles.colorSwatch, isActive && styles.colorSwatchActive]}
                onPress={() => handleSelectColor(color)}
              >
                <View style={[styles.swatchCircle, { backgroundColor: color.hex }]} />
                <Text style={styles.swatchName} numberOfLines={1}>{color.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {customClothes.length > 0 ? (
          <View style={styles.savedSection}>
            <Text style={styles.sectionLabel}>Your recolored wardrobe</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {customClothes.map((item) => (
                <View key={item.id} style={styles.savedCard}>
                  <TintedClothingImage
                    uri={item.image}
                    color={item.color}
                    style={styles.savedImg}
                  />
                  <Text style={styles.savedName} numberOfLines={2}>{item.name}</Text>
                  <View style={styles.savedColorRow}>
                    <View style={[styles.colorDotSmall, { backgroundColor: item.color }]} />
                    <Text style={styles.savedColorName}>{item.colorName}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {colorResult?.inWardrobe ? "From your wardrobe" : "New color look"}
            </Text>
            <Text style={styles.modalSub}>
              {TYPE_LABEL[selectedItem?.type || ""] || "Item"} in {selectedColor?.name}
            </Text>

            {selectedItem && selectedColor && colorResult ? (
              <View style={styles.modalPreview}>
                <View style={styles.modalImgFrame}>
                  <TintedClothingImage
                    uri={colorResult.displayImage}
                    color={colorResult.displayColor}
                    style={styles.modalPreviewImg}
                    recolorGarment
                  />
                </View>
              </View>
            ) : null}

            {colorResult?.inWardrobe ? (
              <View style={styles.inWardrobeBox}>
                <Ionicons name="shirt" size={20} color="#15803d" />
                <Text style={styles.inWardrobeText}>
                  You already have this {selectedColor?.name?.toLowerCase()}{" "}
                  {TYPE_LABEL[selectedItem?.type || ""]?.toLowerCase()} in your collection!
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.nameBox}>
                  <Text style={styles.nameLabel}>Suggested name</Text>
                  <Text style={styles.nameValue}>{generatedName}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      selectedItem &&
                      selectedColor &&
                      setGeneratedName(generateClothName(selectedItem.type, selectedColor.name))
                    }
                  >
                    <Text style={styles.regenerateText}>↻ Generate another name</Text>
                  </TouchableOpacity>
                </View>

                {colorResult?.shopLink ? (
                  <TouchableOpacity
                    style={styles.shopBtn}
                    onPress={() => Linking.openURL(colorResult.shopLink!)}
                  >
                    <Ionicons name="cart" size={20} color="#fff" />
                    <Text style={styles.shopBtnText}>
                      Shop {selectedColor?.name} {TYPE_LABEL[selectedItem?.type || ""]}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {selectedColor && selectedItem ? (
                  <View style={styles.shopRefRow}>
                    <Text style={styles.shopRefLabel}>Similar online</Text>
                    <Image
                      source={{
                        uri: getShopReferenceImage(selectedItem.type, selectedColor.key),
                      }}
                      style={styles.shopRefImg}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}

                <TouchableOpacity style={styles.addBtn} onPress={handleAddToWardrobe}>
                  <Ionicons name="add-circle" size={22} color="#fff" />
                  <Text style={styles.addBtnText}>Add to My Wardrobe</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipBtn} onPress={() => setShowAddModal(false)}>
                  <Text style={styles.skipBtnText}>Not now — skip</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.tryAnotherBtn} onPress={() => setShowAddModal(false)}>
              <Text style={styles.tryAnotherText}>Try a different color</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ColorAnalysisScreen;

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
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: "#111" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 6, lineHeight: 21, marginBottom: 20 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 20 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tabActive: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  tabTextActive: { color: "#fff" },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 12 },
  itemScroll: { paddingBottom: 4, marginBottom: 20 },
  itemCard: {
    width: 108,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    position: "relative",
  },
  itemCardSelected: { borderColor: "#6366f1", backgroundColor: "#f5f3ff" },
  itemImgWrap: { width: "100%", height: 90, borderRadius: 10 },
  itemType: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center", marginTop: 6 },
  itemColorTag: { fontSize: 9, color: "#7c3aed", textAlign: "center", marginTop: 2 },
  selectedDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  previewBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  previewInner: { flexDirection: "row", alignItems: "center", gap: 16 },
  previewImgFrame: {
    width: 140,
    height: 160,
    borderRadius: 14,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    overflow: "hidden",
  },
  previewImg: { width: 140, height: 160 },
  previewInfo: { flex: 1 },
  previewType: { fontSize: 12, color: "#9ca3af", fontWeight: "600", textTransform: "uppercase" },
  previewHint: { fontSize: 14, color: "#9ca3af", marginTop: 8, lineHeight: 20 },
  colorRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  colorDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: "#e5e7eb" },
  colorNameText: { fontSize: 16, fontWeight: "700", color: "#111" },
  wardrobeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    backgroundColor: "#dcfce7",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  wardrobeBadgeText: { fontSize: 12, color: "#15803d", fontWeight: "600" },
  shopBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    backgroundColor: "#f5f3ff",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shopBadgeText: { fontSize: 11, color: "#7c3aed", fontWeight: "600" },
  previewName: { fontSize: 14, color: "#6366f1", fontWeight: "600", marginTop: 6 },
  previewEmpty: { alignItems: "center", paddingVertical: 30 },
  previewEmptyText: { color: "#9ca3af", marginTop: 10, fontSize: 14 },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  colorSwatch: {
    width: "30%",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  colorSwatchActive: { borderColor: "#6366f1", backgroundColor: "#f5f3ff" },
  swatchCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    marginBottom: 6,
  },
  swatchName: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center" },
  savedSection: { marginTop: 8 },
  savedCard: {
    width: 120,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  savedImg: { width: "100%", height: 90, borderRadius: 10 },
  savedName: { fontSize: 12, fontWeight: "700", color: "#111", marginTop: 8 },
  savedColorRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  colorDotSmall: { width: 10, height: 10, borderRadius: 5 },
  savedColorName: { fontSize: 10, color: "#6b7280" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    maxHeight: "90%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#111", textAlign: "center" },
  modalSub: { fontSize: 14, color: "#6b7280", textAlign: "center", marginTop: 4, marginBottom: 12 },
  modalPreview: { alignItems: "center", marginVertical: 8 },
  modalImgFrame: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    overflow: "hidden",
  },
  modalPreviewImg: { width: 180, height: 200 },
  inWardrobeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#dcfce7",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  inWardrobeText: { flex: 1, fontSize: 14, color: "#15803d", fontWeight: "600", lineHeight: 20 },
  nameBox: {
    backgroundColor: "#f5f3ff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ede9fe",
  },
  nameLabel: { fontSize: 11, fontWeight: "700", color: "#7c3aed", textTransform: "uppercase" },
  nameValue: { fontSize: 18, fontWeight: "800", color: "#111", marginTop: 4 },
  regenerateText: { fontSize: 13, color: "#6366f1", fontWeight: "600", marginTop: 8 },
  shopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#7c3aed",
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 12,
  },
  shopBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  shopRefRow: { marginBottom: 12 },
  shopRefLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 6 },
  shopRefImg: { width: "100%", height: 100, borderRadius: 12 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#111",
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  skipBtn: {
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    marginBottom: 8,
  },
  skipBtnText: { fontSize: 15, fontWeight: "600", color: "#6b7280" },
  tryAnotherBtn: { paddingVertical: 10, alignItems: "center" },
  tryAnotherText: { fontSize: 14, color: "#6366f1", fontWeight: "600" },
});
