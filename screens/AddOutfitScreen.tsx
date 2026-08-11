import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useMemo, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getMergedClothes } from "../utils/clothes";
import TintedClothingImage from "../components/TintedClothingImage";
import { useWardrobeStore } from "../store/wardrobeStore";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const CATEGORIES = ["All", "Tops", "Bottoms", "Shoes", "Skirts"];

const AddOutfitScreen = () => {
  const route = useRoute();
  const { date, savedOutfits, preselectedIds, editOutfitId } = (route?.params || {}) as {
    date?: string;
    savedOutfits?: Record<string, any[]>;
    preselectedIds?: (number | string)[];
    editOutfitId?: string;
  };
  const navigation = useNavigation();
  const [activeCategory, setActiveCategory] = useState("All");
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [selfieItem, setSelfieItem] = useState<any>(null);

  const customClothes = useWardrobeStore((s) => s.customClothes);
  const popularClothes = useMemo(() => getMergedClothes(), [customClothes]);

  const [selected, setSelected] = useState<(number | string)[]>(preselectedIds || []);

  const filteredClothes = useMemo(() => {
    if (activeCategory === "All") return popularClothes;
    return popularClothes.filter((item) => {
      switch (activeCategory) {
        case "Tops":
          return item.type === "shirt";
        case "Bottoms":
          return item.type === "pants";
        case "Skirts":
          return item.type === "skirts";
        case "Shoes":
          return item.type === "shoes";
        default:
          return true;
      }
    });
  }, [activeCategory, popularClothes]);

  const toggleSelect = (id: number | string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    const selectedItems = popularClothes.filter((item) =>
      selected.includes(item?.id)
    );
    if (selfieItem) {
      selectedItems.unshift(selfieItem);
    }
    if (selectedItems.length === 0) {
      Alert.alert("Select Items", "Please select at least one clothing item.");
      return;
    }
    navigation.navigate("DesignRoom", {
      selectedItems,
      date,
      savedOutfits,
      editOutfitId,
    });
  };

  const handleSelfie = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow access to your photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const selfie = {
        id: 9999,
        image: result.assets[0].uri,
        type: "selfie",
        gender: "unisex",
      };
      setSelfieItem(selfie);
      Alert.alert("Selfie Added", "Your selfie will be used as outfit background.");
    }
  };

  const handleSuggestions = () => {
    navigation.navigate("AIOutfit");
  };

  const handleSavedOutfits = () => {
    const outfits = savedOutfits ? Object.entries(savedOutfits) : [];
    if (outfits.length === 0) {
      Alert.alert("No Saved Outfits", "You haven't saved any outfits yet.");
      return;
    }
    setShowSavedModal(true);
  };

  const loadSavedOutfit = (items: any[]) => {
    const ids = items
      .map((item) => {
        const match = popularClothes.find((c) => c.image === item.image);
        return match?.id;
      })
      .filter(Boolean) as number[];
    setSelected(ids);
    setShowSavedModal(false);
    Alert.alert("Loaded", "Saved outfit items have been selected.");
  };

  const savedOutfitEntries = savedOutfits
    ? Object.entries(savedOutfits)
    : [];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">{editOutfitId ? "Edit outfit" : "Add outfit"}</Text>
        <Text className="text-gray-500">{date}</Text>
      </View>

      <View className="flex-row justify-around mt-4 px-4">
        <TouchableOpacity
          onPress={handleSelfie}
          className="bg-gray-100 w-[30%] py-3 rounded-lg items-center"
        >
          <Ionicons name="camera-outline" size={22} color="black" />
          <Text className="font-medium mt-1">Selfie</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSuggestions}
          className="bg-gray-100 w-[30%] py-3 rounded-lg items-center"
        >
          <Ionicons name="sparkles-outline" size={22} color="black" />
          <Text className="font-medium mt-1">Suggestions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSavedOutfits}
          className="bg-gray-100 w-[30%] py-3 rounded-lg items-center"
        >
          <Ionicons name="shirt-outline" size={22} color="black" />
          <Text className="font-medium mt-1">Saved Outfits</Text>
        </TouchableOpacity>
      </View>

      {selfieItem && (
        <View className="flex-row items-center px-4 mt-3">
          <Image
            source={{ uri: selfieItem.image }}
            className="w-12 h-12 rounded-full mr-2"
          />
          <Text className="text-sm text-gray-600 flex-1">Selfie added</Text>
          <TouchableOpacity onPress={() => setSelfieItem(null)}>
            <Ionicons name="close-circle" size={22} color="gray" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4 pl-4"
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat)}
            className={`px-4 py-2 mr-3 rounded-full ${
              activeCategory === cat ? "bg-black" : "bg-gray-100"
            }`}
          >
            <Text
              className={`font-medium ${
                activeCategory === cat ? "text-white" : "text-gray-600"
              }`}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView className="flex-1 mt-4">
        <Text className="text-lg font-semibold px-4 mt-2">
          {activeCategory === "All" ? "All Clothes" : activeCategory}
        </Text>
        {filteredClothes.length === 0 ? (
          <Text className="px-4 mt-4 text-gray-500">
            No items in this category.
          </Text>
        ) : (
          <View className="flex-row flex-wrap px-4 mt-2 mb-20">
            {filteredClothes?.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => toggleSelect(item?.id)}
                className="w-1/3 p-1 relative"
              >
                <TintedClothingImage
                  uri={item?.image}
                  color={item?.color}
                  style={{ width: "100%", height: 128, borderRadius: 6 }}
                />
                {item?.name ? (
                  <Text className="text-xs text-center mt-1 text-gray-600" numberOfLines={1}>
                    {item.name}
                  </Text>
                ) : null}
                <View className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 items-center justify-center">
                  <Text className="text-xs">
                    {item.gender === "m" ? "♂" : item.gender === "f" ? "♀" : "⚪"}
                  </Text>
                </View>
                <View
                  className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 ${
                    selected.includes(item.id) ? "bg-black" : "border-gray-400"
                  } items-center justify-center`}
                >
                  {selected.includes(item?.id) && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {(selected.length > 0 || selfieItem) && (
        <View className="absolute bottom-0 left-0 right-0 bg-white p-3 border-t">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selfieItem && (
              <Image
                source={{ uri: selfieItem.image }}
                className="w-16 h-16 mr-3 rounded-md"
              />
            )}
            {selected?.map((id) => {
              const item = popularClothes.find((c) => c.id === id);
              return (
                <Image
                  key={id}
                  source={{ uri: item?.image }}
                  className="w-16 h-16 mr-3 rounded-md"
                />
              );
            })}
          </ScrollView>
          <TouchableOpacity
            onPress={handleNext}
            className="bg-black py-3 rounded-lg mt-3 mb-3 items-center self-end w-24"
          >
            <Text className="text-white font-semibold">Next</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showSavedModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl max-h-[70%] p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold">Saved Outfits</Text>
              <TouchableOpacity onPress={() => setShowSavedModal(false)}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {savedOutfitEntries.map(([outfitDate, items]) => (
                <TouchableOpacity
                  key={outfitDate}
                  onPress={() => loadSavedOutfit(items)}
                  className="flex-row items-center p-3 mb-2 bg-gray-50 rounded-lg"
                >
                  <View className="flex-row flex-1">
                    {items.slice(0, 3).map((item: any, idx: number) => (
                      <Image
                        key={idx}
                        source={{ uri: item.image }}
                        className="w-12 h-12 mr-1"
                        resizeMode="contain"
                      />
                    ))}
                  </View>
                  <Text className="text-sm text-gray-600">{outfitDate}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AddOutfitScreen;

const styles = StyleSheet.create({});
