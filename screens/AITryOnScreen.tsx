import {
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import moment from "moment";
import {
  ClothingItem,
  getBottoms,
  getShirts,
  getShoes,
} from "../utils/clothes";
import TintedClothingImage from "../components/TintedClothingImage";

const { width, height } = Dimensions.get("window");

type Step = "select" | "capture" | "preview";

const AITryOnScreen = () => {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<Step>("select");
  const [selectedShirt, setSelectedShirt] = useState<ClothingItem | null>(null);
  const [selectedPants, setSelectedPants] = useState<ClothingItem | null>(null);
  const [selectedShoes, setSelectedShoes] = useState<ClothingItem | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const shirts = getShirts();
  const bottoms = getBottoms();
  const shoes = getShoes();

  const canContinue =
    selectedShirt !== null && selectedPants !== null;

  const goToCapture = () => {
    if (!canContinue) {
      Alert.alert("Select clothes", "Please pick a shirt and pants from your wardrobe.");
      return;
    }
    setStep("capture");
  };

  const requestCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera needed", "Please allow camera access to try on outfits.");
      return false;
    }
    return true;
  };

  const requestGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photos needed", "Please allow photo access to upload your picture.");
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const ok = await requestCamera();
    if (!ok) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
      cameraType: ImagePicker.CameraType.front,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setStep("preview");
    }
  };

  const handleUploadPhoto = async () => {
    const ok = await requestGallery();
    if (!ok) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setStep("preview");
    }
  };

  const resetTryOn = () => {
    setStep("select");
    setSelectedShirt(null);
    setSelectedPants(null);
    setSelectedShoes(null);
    setPhotoUri(null);
  };

  const saveToOutfit = () => {
    const selectedItems = [
      { id: 9999, image: photoUri!, type: "selfie", gender: "unisex" },
      selectedShirt!,
      selectedPants!,
      ...(selectedShoes ? [selectedShoes] : []),
    ].map((item, idx) => ({
      ...item,
      id: item.id || idx,
      x: width / 2 - 120,
      y: item.type === "selfie" ? 0 : height / 2 - 100,
    }));

    navigation.navigate("DesignRoom", {
      selectedItems,
      date: moment().format("ddd, Do MMM"),
      savedOutfits: {},
    });
  };

  const renderClothingPicker = (
    title: string,
    subtitle: string,
    items: ClothingItem[],
    selected: ClothingItem | null,
    onSelect: (item: ClothingItem) => void,
    required = false
  ) => (
    <View style={styles.pickerSection}>
      <View style={styles.pickerHeader}>
        <Text style={styles.pickerTitle}>
          {title} {required ? <Text style={styles.required}>*</Text> : null}
        </Text>
        <Text style={styles.pickerSub}>{subtitle}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
        {items.map((item) => {
          const isSelected = selected?.id === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.clothCard, isSelected && styles.clothCardSelected]}
              onPress={() => onSelect(item)}
            >
              <TintedClothingImage uri={item.image} color={item.color} style={styles.clothImg} />
              {isSelected ? (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderSelectStep = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <View style={styles.heroBox}>
        <Ionicons name="shirt" size={32} color="#6366f1" />
        <Text style={styles.heroTitle}>Pick your outfit</Text>
        <Text style={styles.heroSub}>
          Choose a shirt and pants from your wardrobe. Then we'll dress you in them.
        </Text>
      </View>

      {renderClothingPicker(
        "Which shirt?",
        "Tap to select from your collection",
        shirts,
        selectedShirt,
        setSelectedShirt,
        true
      )}

      {renderClothingPicker(
        "Which pants?",
        "Pick bottoms for your look",
        bottoms,
        selectedPants,
        setSelectedPants,
        true
      )}

      {renderClothingPicker(
        "Shoes (optional)",
        "Add footwear if you like",
        shoes,
        selectedShoes,
        setSelectedShoes
      )}

      {(selectedShirt || selectedPants) ? (
        <View style={styles.selectionSummary}>
          <Text style={styles.summaryLabel}>Selected</Text>
          <View style={styles.summaryRow}>
            {selectedShirt ? (
              <Image source={{ uri: selectedShirt.image }} style={styles.summaryThumb} resizeMode="contain" />
            ) : null}
            {selectedPants ? (
              <Image source={{ uri: selectedPants.image }} style={styles.summaryThumb} resizeMode="contain" />
            ) : null}
            {selectedShoes ? (
              <Image source={{ uri: selectedShoes.image }} style={styles.summaryThumb} resizeMode="contain" />
            ) : null}
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.primaryBtn, !canContinue && styles.primaryBtnDisabled]}
        onPress={goToCapture}
        disabled={!canContinue}
      >
        <Text style={styles.primaryBtnText}>Next — Take or upload photo</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderCaptureStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.heroBox}>
        <Ionicons name="camera" size={32} color="#6366f1" />
        <Text style={styles.heroTitle}>Your photo</Text>
        <Text style={styles.heroSub}>
          Stand in front of the camera or upload a full-body photo. We'll wear your selected clothes on you.
        </Text>
      </View>

      <View style={styles.selectedPreview}>
        <Text style={styles.summaryLabel}>Outfit to try on</Text>
        <View style={styles.summaryRow}>
          {selectedShirt ? (
            <Image source={{ uri: selectedShirt.image }} style={styles.summaryThumb} resizeMode="contain" />
          ) : null}
          {selectedPants ? (
            <Image source={{ uri: selectedPants.image }} style={styles.summaryThumb} resizeMode="contain" />
          ) : null}
          {selectedShoes ? (
            <Image source={{ uri: selectedShoes.image }} style={styles.summaryThumb} resizeMode="contain" />
          ) : null}
        </View>
      </View>

      <TouchableOpacity style={styles.cameraBtn} onPress={handleTakePhoto}>
        <View style={styles.cameraIconWrap}>
          <Ionicons name="camera" size={36} color="#fff" />
        </View>
        <Text style={styles.cameraBtnTitle}>Open Camera</Text>
        <Text style={styles.cameraBtnSub}>Stand in front and snap a photo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadPhoto}>
        <Ionicons name="images-outline" size={24} color="#6366f1" />
        <View style={styles.uploadBtnText}>
          <Text style={styles.uploadBtnTitle}>Upload from gallery</Text>
          <Text style={styles.uploadBtnSub}>Use an existing photo of yourself</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={() => setStep("select")}>
        <Ionicons name="arrow-back" size={18} color="#6b7280" />
        <Text style={styles.backLinkText}>Change clothes selection</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPreviewStep = () => (
    <View style={styles.previewWrap}>
      <View style={styles.tryOnCanvas}>
        {photoUri ? (
          <ImageBackground source={{ uri: photoUri }} style={styles.personPhoto} resizeMode="cover">
            <View style={styles.overlayDark} />

            {selectedShirt ? (
              <TintedClothingImage
                uri={selectedShirt.image}
                color={selectedShirt.color}
                style={styles.overlayShirt}
              />
            ) : null}

            {selectedPants ? (
              <TintedClothingImage
                uri={selectedPants.image}
                color={selectedPants.color}
                style={styles.overlayPants}
              />
            ) : null}

            {selectedShoes ? (
              <TintedClothingImage
                uri={selectedShoes.image}
                color={selectedShoes.color}
                style={styles.overlayShoes}
              />
            ) : null}
          </ImageBackground>
        ) : null}
      </View>

      <View style={styles.previewPanel}>
        <Text style={styles.previewTitle}>Your virtual try-on</Text>
        <Text style={styles.previewSub}>
          Wearing your selected wardrobe items
        </Text>

        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep("capture")}>
            <Ionicons name="camera-outline" size={18} color="#111" />
            <Text style={styles.secondaryBtnText}>Retake photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={saveToOutfit}>
            <Ionicons name="create-outline" size={18} color="#111" />
            <Text style={styles.secondaryBtnText}>Adjust fit</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={resetTryOn}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.primaryBtnText}>Try another outfit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const stepLabels = { select: "1. Pick clothes", capture: "2. Your photo", preview: "3. Try on" };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step === "select" ? navigation.goBack() : step === "capture" ? setStep("select") : setStep("capture"))}>
          <Ionicons name="chevron-back" size={28} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI Try On</Text>
          <Text style={styles.headerStep}>{stepLabels[step]}</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.stepIndicator}>
        {(["select", "capture", "preview"] as Step[]).map((s, i) => (
          <View
            key={s}
            style={[
              styles.stepDot,
              step === s && styles.stepDotActive,
              (["select", "capture", "preview"].indexOf(step) > i) && styles.stepDotDone,
            ]}
          />
        ))}
      </View>

      {step === "select" && renderSelectStep()}
      {step === "capture" && renderCaptureStep()}
      {step === "preview" && renderPreviewStep()}
    </SafeAreaView>
  );
};

export default AITryOnScreen;

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
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  headerStep: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  stepDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
  },
  stepDotActive: { backgroundColor: "#6366f1", width: 56 },
  stepDotDone: { backgroundColor: "#a5b4fc" },
  stepContent: { padding: 20, paddingBottom: 40 },
  heroBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ede9fe",
  },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#111", marginTop: 12 },
  heroSub: { fontSize: 14, color: "#6b7280", textAlign: "center", marginTop: 8, lineHeight: 21 },
  pickerSection: { marginBottom: 20 },
  pickerHeader: { marginBottom: 12 },
  pickerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  required: { color: "#ef4444" },
  pickerSub: { fontSize: 13, color: "#9ca3af", marginTop: 2 },
  pickerScroll: { paddingRight: 8 },
  clothCard: {
    width: 110,
    height: 130,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 10,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  clothCardSelected: { borderColor: "#6366f1", backgroundColor: "#f5f3ff" },
  clothImg: { width: "100%", height: 90 },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  selectionSummary: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  summaryLabel: { fontSize: 13, fontWeight: "600", color: "#6b7280", marginBottom: 10 },
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryThumb: {
    width: 70,
    height: 70,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#111",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  primaryBtnDisabled: { backgroundColor: "#9ca3af" },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  selectedPreview: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cameraBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 16,
  },
  cameraIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cameraBtnTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  cameraBtnSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 4 },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 20,
  },
  uploadBtnText: { flex: 1 },
  uploadBtnTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  uploadBtnSub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  backLinkText: { fontSize: 14, color: "#6b7280", fontWeight: "500" },
  previewWrap: { flex: 1 },
  tryOnCanvas: {
    flex: 1,
    backgroundColor: "#111",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  personPhoto: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  overlayShirt: {
    position: "absolute",
    top: height * 0.12,
    width: width * 0.72,
    height: width * 0.72,
    alignSelf: "center",
    zIndex: 3,
  },
  overlayPants: {
    position: "absolute",
    top: height * 0.28,
    width: width * 0.68,
    height: width * 0.75,
    alignSelf: "center",
    zIndex: 2,
  },
  overlayShoes: {
    position: "absolute",
    bottom: height * 0.08,
    width: width * 0.45,
    height: width * 0.28,
    alignSelf: "center",
    zIndex: 4,
  },
  previewPanel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  previewTitle: { fontSize: 20, fontWeight: "800", color: "#111" },
  previewSub: { fontSize: 14, color: "#6b7280", marginTop: 4, marginBottom: 16 },
  previewActions: { flexDirection: "row", gap: 10, marginBottom: 12 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  secondaryBtnText: { fontSize: 13, fontWeight: "600", color: "#111" },
});
