import {
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { getMergedClothes } from "../utils/clothes";
import TintedClothingImage from "../components/TintedClothingImage";

const { width, height } = Dimensions.get("window");

const BACKGROUND_COLORS = [
  "#000000",
  "#1A1A2E",
  "#2C3E50",
  "#8B4513",
  "#F5F5DC",
  "#FFB6C1",
  "#87CEEB",
  "#FFFFFF",
];

interface ClothingItem {
  id: number | string;
  image: string;
  x: number;
  y: number;
  type?: "pants" | "shoes" | "shirt" | "skirts" | "selfie";
  gender?: "m" | "f" | "unisex";
  color?: string;
}

const DraggableClothingItem = ({ item }: { item: ClothingItem }) => {
  const translateX = useSharedValue(item?.x);
  const translateY = useSharedValue(item?.y);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX + item.x;
      translateY.value = e.translationY + item.y;
    })
    .onEnd(() => {
      item.x = translateX.value;
      item.y = translateY.value;
    });

  const animateStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    position: "absolute",
    zIndex:
      item.type === "selfie"
        ? 1
        : item.type === "shirt" || item.type === "skirts"
        ? 20
        : 10,
  }));

  const itemSize =
    item.type === "selfie"
      ? { width: width, height: height * 0.7 }
      : { width: 240, height: item?.type == "shoes" ? 180 : 240 };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animateStyle}>
        {item.type === "selfie" || !item.color ? (
          <Image
            resizeMode={item.type === "selfie" ? "cover" : "contain"}
            style={itemSize}
            source={{ uri: item?.image }}
          />
        ) : (
          <TintedClothingImage
            uri={item.image}
            color={item.color}
            style={itemSize}
          />
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const getYPosition = (type: string, items: ClothingItem[]) => {
  const shirtItem = items.find((i) => i.type === "shirt");
  const pantsItem = items.find((i) => i.type === "pants");
  if (type === "shirt" || type === "skirts") return height / 2 - 240 - 100;
  if (type === "pants") return shirtItem ? height / 2 - 100 : height / 2;
  if (type === "shoes") return pantsItem || shirtItem ? height / 2 + 100 : height / 2 + 60;
  return height / 2;
};

const DesignRoomScreen = () => {
  const route = useRoute();
  const { selectedItems, date, savedOutfits, editOutfitId } = route.params as {
    selectedItems: ClothingItem[];
    date: string;
    savedOutfits: Record<string, any[]>;
    editOutfitId?: string;
  };
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAddClothes, setShowAddClothes] = useState(false);
  const navigation = useNavigation();
  const allClothes = getMergedClothes();

  useEffect(() => {
    const initialClothes = selectedItems.map((item) => {
      if (item.type === "selfie") {
        return { ...item, x: 0, y: 0 };
      }
      return {
        ...item,
        x: width / 2 - 120,
        y: getYPosition(item.type || "shirt", selectedItems),
      };
    });
    setClothes(initialClothes);
  }, [selectedItems]);

  const addClothingItem = (item: ClothingItem) => {
    const newId = Date.now();
    const newItem: ClothingItem = {
      ...item,
      id: newId,
      x: width / 2 - 120,
      y: getYPosition(item.type || "shirt", clothes),
    };
    setClothes((prev) => [...prev, newItem]);
    setShowAddClothes(false);
  };

  const handleNext = () => {
    navigation.navigate("NewOutfit", {
      selectedItems: clothes,
      date,
      savedOutfits,
      backgroundColor,
      editOutfitId,
    });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor }}>
      <View className="flex-row justify-between items-center p-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg">{date}</Text>
        <TouchableOpacity
          onPress={handleNext}
          className="bg-gray-700 px-4 py-2 rounded"
        >
          <Text className="text-white font-semibold">Next</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-1">
        {clothes?.map((item) => (
          <DraggableClothingItem key={item.id} item={item} />
        ))}
      </View>
      <View className="flex-row justify-between p-4">
        <TouchableOpacity
          className="bg-gray-700 px-4 py-2 rounded flex-row items-center"
          onPress={() => setShowAddClothes(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text className="text-white ml-1">Add Clothes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-gray-700 p-2 rounded"
          onPress={() => setShowColorPicker(true)}
        >
          <Text className="text-white">Background</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showAddClothes} animationType="slide">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
            <Text className="text-lg font-semibold">Add Clothes</Text>
            <TouchableOpacity onPress={() => setShowAddClothes(false)}>
              <Ionicons name="close" size={28} color="black" />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 px-2">
            <View className="flex-row flex-wrap">
              {allClothes.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="w-1/3 p-2"
                  onPress={() => addClothingItem(item as ClothingItem)}
                >
                  {item.color ? (
                    <TintedClothingImage
                      uri={item.image}
                      color={item.color}
                      style={{ width: "100%", height: 110, borderRadius: 8 }}
                    />
                  ) : (
                    <Image
                      source={{ uri: item.image }}
                      resizeMode="contain"
                      style={{ width: "100%", height: 110, backgroundColor: "#f9f9f9", borderRadius: 8 }}
                    />
                  )}
                  <Text className="text-xs text-center mt-1 capitalize">{item.type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showColorPicker} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowColorPicker(false)}
        >
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-lg font-semibold mb-4">Choose Background</Text>
            <View className="flex-row flex-wrap gap-4">
              {BACKGROUND_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => {
                    setBackgroundColor(color);
                    setShowColorPicker(false);
                  }}
                  style={{
                    backgroundColor: color,
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    borderWidth: backgroundColor === color ? 3 : 1,
                    borderColor: backgroundColor === color ? "#000" : "#ccc",
                  }}
                />
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default DesignRoomScreen;

const styles = StyleSheet.create({});
