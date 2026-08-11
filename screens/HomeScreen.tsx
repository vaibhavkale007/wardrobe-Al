import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { getAllClothes, searchClothes } from "../utils/clothes";
import { confirmDelete } from "../utils/confirm";

const { width, height } = Dimensions.get("window");

type SavedOutfitEntry = {
  _id: string;
  date: string;
  items: any[];
  caption?: string;
  occasion?: string;
};

const features = [
  { title: "AI Suggestions", image: "https://i.pinimg.com/736x/2e/3d/d1/2e3dd14ac81b207ee6d86bc99ef576eb.jpg", screen: "AIChat" },
  { title: "AI Outfit Maker", image: "https://i.pinimg.com/736x/50/83/0e/50830e372ee844c1f429b8ef89e26fd1.jpg", screen: "AIOutfit" },
  { title: "AI Try On", image: "https://i.pinimg.com/736x/c2/78/95/c2789530a2dc8c9dbfd4aa5e2e70d608.jpg", screen: "AITryOn" },
  { title: "Color Analysis", image: "https://i.pinimg.com/736x/84/bf/ce/84bfce1e46977d50631c4ef2f72f83b1.jpg", screen: "ColorAnalysis" },
];

const popularItems = [
  { username: "Trisha Wushres", profile: "https://randomuser.me/api/portraits/women/1.jpg", image: "https://pngimg.com/uploads/leggings/leggings_PNG46.png", itemName: "Floral Skirt" },
  { username: "Anna Cris", profile: "https://randomuser.me/api/portraits/women/2.jpg", image: "https://pngimg.com/uploads/jeans/jeans_PNG5777.png", itemName: "Mens Jeans" },
  { username: "Isabella", profile: "https://randomuser.me/api/portraits/women/3.jpg", image: "https://pngimg.com/uploads/men_shoes/men_shoes_PNG7485.png", itemName: "Shoes" },
];

const initialStories = [
  { username: "Your OOTD", avatar: "https://picsum.photos/100/100?random=8", isOwn: true, viewed: false },
  { username: "_trishwushres", avatar: "https://picsum.photos/100/100?random=10", isOwn: false, viewed: false },
  { username: "myglam", avatar: "https://picsum.photos/100/100?random=11", isOwn: false, viewed: false },
  { username: "stylist", avatar: "https://picsum.photos/100/100?random=12", isOwn: false, viewed: false },
];

const normalizeEntry = (date: string, value: any): SavedOutfitEntry | null => {
  if (!value) return null;
  if (Array.isArray(value)) {
    return { _id: "", date, items: value };
  }
  if (value.items) {
    return {
      _id: String(value._id || ""),
      date: value.date || date,
      items: value.items,
      caption: value.caption,
      occasion: value.occasion,
    };
  }
  return null;
};

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const isFocused = useIsFocused();
  const [savedOutfits, setSavedOutfits] = useState<Record<string, SavedOutfitEntry>>({});
  const [stories, setStories] = useState(initialStories);
  const [showSearch, setShowSearch] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [activeStory, setActiveStory] = useState<(typeof initialStories)[0] | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ label: string; outfit: SavedOutfitEntry | null } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState(false);
  const searchResults = searchQuery.trim() ? searchClothes(searchQuery) : [];

  const buildOutfitsMap = (data: any[]) =>
    data.reduce((acc: Record<string, SavedOutfitEntry>, outfit: any) => {
      if (!outfit?.date) return acc;
      acc[outfit.date] = {
        _id: String(outfit._id),
        date: outfit.date,
        items: outfit.items || [],
        caption: outfit.caption,
        occasion: outfit.occasion,
      };
      return acc;
    }, {});

  const fetchSavedOutfits = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      const decoded = jwtDecode(token) as { id: string };
      const response = await axios.get(
        `${API_BASE_URL}/save-outfit/user/${decoded.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedOutfits(buildOutfitsMap(response.data));
    } catch (error) {
      console.error("Failed to fetch saved outfits", error);
    }
  }, []);

  useEffect(() => {
    if (isFocused) fetchSavedOutfits();
  }, [isFocused, fetchSavedOutfits]);

  useEffect(() => {
    const params = route.params as { savedOutfits?: Record<string, any>; refreshOutfits?: number } | undefined;
    if (params?.refreshOutfits) {
      fetchSavedOutfits();
      navigation.setParams({ refreshOutfits: undefined });
      return;
    }
    if (params?.savedOutfits) {
      const normalized: Record<string, SavedOutfitEntry> = {};
      Object.entries(params.savedOutfits).forEach(([date, value]) => {
        const entry = normalizeEntry(date, value);
        if (entry) normalized[date] = entry;
      });
      setSavedOutfits((prev) => {
        const merged = { ...prev, ...normalized };
        return merged;
      });
      navigation.setParams({ savedOutfits: undefined });
    }
  }, [route.params, navigation]);

  const getSavedOutfitsForNav = () => {
    const map: Record<string, any[]> = {};
    Object.entries(savedOutfits).forEach(([date, o]) => {
      map[date] = o.items;
    });
    return map;
  };

  const performDelete = async (dateLabel: string, outfitId?: string) => {
    setDeleting(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const headers = { Authorization: `Bearer ${token}` };

      if (outfitId) {
        await axios.delete(`${API_BASE_URL}/save-outfit/${outfitId}`, { headers });
      } else {
        await axios.delete(
          `${API_BASE_URL}/save-outfit/by-date/${encodeURIComponent(dateLabel)}`,
          { headers }
        );
      }

      setSavedOutfits((prev) => {
        const next = { ...prev };
        delete next[dateLabel];
        return next;
      });
      setShowDayModal(false);
      setSelectedDay(null);
      await fetchSavedOutfits();
    } catch {
      Alert.alert("Error", "Failed to delete outfit. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleStoryPress = (story: (typeof initialStories)[0], idx: number) => {
    if (story.isOwn) {
      const today = moment().format("ddd, Do MMM");
      const todayOutfit = savedOutfits[today];
      if (todayOutfit) {
        setSelectedDay({ label: today, outfit: todayOutfit });
        setShowDayModal(true);
      } else {
        navigation.navigate("AddOutfit", {
          date: today,
          savedOutfits: getSavedOutfitsForNav(),
        });
      }
    } else {
      setActiveStory(story);
      setShowStory(true);
      setStories((prev) => prev.map((s, i) => (i === idx ? { ...s, viewed: true } : s)));
    }
  };

  const handleDayPress = (dayLabel: string) => {
    const outfit = savedOutfits[dayLabel] || null;
    if (outfit) {
      setSelectedDay({ label: dayLabel, outfit });
      setShowDayModal(true);
    } else {
      navigation.navigate("AddOutfit", {
        date: dayLabel,
        savedOutfits: getSavedOutfitsForNav(),
      });
    }
  };

  const handleEditOutfit = () => {
    if (!selectedDay?.outfit) return;
    setShowDayModal(false);
    const allClothes = getAllClothes();
    const preselectedIds = selectedDay.outfit.items
      .map((item: any) => allClothes.find((c) => c.image === item.image)?.id)
      .filter(Boolean) as number[];

    navigation.navigate("AddOutfit", {
      date: selectedDay.label,
      savedOutfits: getSavedOutfitsForNav(),
      preselectedIds,
      editOutfitId: selectedDay.outfit._id || undefined,
    });
  };

  const handleDeleteOutfit = () => {
    if (!selectedDay?.outfit) return;
    const dateLabel = selectedDay.label;
    const outfitId = selectedDay.outfit._id;
    confirmDelete(`Remove outfit for ${dateLabel}?`, () =>
      performDelete(dateLabel, outfitId || undefined)
    );
  };

  const generateDates = () => {
    const today = moment().startOf("day");
    const dates = [];
    for (let i = -3; i <= 3; i++) {
      dates.push({ label: today.clone().add(i, "days").format("ddd, Do MMM") });
    }
    return dates;
  };
  const dates = generateDates();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 bg-white" nestedScrollEnabled>
        <View className="flex-row items-center justify-between px-4 pt-4">
          <Text className="text-3xl font-bold">Fits</Text>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity className="bg-black px-4 py-1 rounded-full" onPress={() => setShowUpgrade(true)}>
              <Text className="text-white font-semibold text-sm">Upgrade</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert("Notifications", "No new notifications")}>
              <Ionicons name="notifications-outline" color="black" size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSearch(true)}>
              <Ionicons name="search-outline" color="black" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Story rings — use row + TouchableOpacity for reliable taps on web */}
        <View style={{ flexDirection: "row", paddingLeft: 16, marginTop: 16, paddingBottom: 4 }}>
          {stories.map((story, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.7}
              onPress={() => handleStoryPress(story, idx)}
              style={{ marginRight: 16, alignItems: "center", width: 72 }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  borderWidth: 2,
                  borderColor: story.viewed ? "#e5e5e5" : "#c084fc",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <Image
                  source={{ uri: story.avatar }}
                  style={{ width: 60, height: 60, borderRadius: 30 }}
                />
                {story.isOwn && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      backgroundColor: "#000",
                      borderRadius: 10,
                      width: 20,
                      height: 20,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 12 }}>+</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 11, marginTop: 4, textAlign: "center" }} numberOfLines={1}>
                {story.username}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row items-center justify-between mt-6 px-4">
          <Text className="text-lg font-semibold">Your Week</Text>
          <Text className="text-gray-500">Planner</Text>
        </View>

        <ScrollView className="mt-4 pl-4" horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
          {dates.map((day, idx) => {
            const outfit = savedOutfits[day.label];
            return (
              <View key={idx} className="mr-3">
                <Pressable
                  onPress={() => handleDayPress(day.label)}
                  className={`w-24 h-40 rounded-xl items-center justify-center overflow-hidden shadow-md ${
                    outfit ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  {!outfit && (
                    <View className="w-full h-full items-center justify-center">
                      <Text className="text-3xl text-gray-400">+</Text>
                    </View>
                  )}
                  {outfit && (
                    <View className="items-center">
                      {outfit.items.find((item) => item.type === "shirt") && (
                        <Image
                          source={{ uri: outfit.items.find((item) => item.type === "shirt")?.image }}
                          style={{ width: 80, height: 80 }}
                          resizeMode="contain"
                        />
                      )}
                      {outfit.items.find((item) => item.type === "pants" || item.type === "skirts") && (
                        <Image
                          source={{
                            uri: outfit.items.find((item) => item.type === "pants" || item.type === "skirts")?.image,
                          }}
                          style={{ width: 80, height: 80 }}
                          resizeMode="contain"
                        />
                      )}
                    </View>
                  )}
                </Pressable>
                <Text className="text-xs text-center mt-1 text-gray-700">{day.label}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View className="flex-row flex-wrap justify-between px-4 mt-6">
          {features.map((feature, idx) => (
            <Pressable
              key={idx}
              onPress={() => navigation.navigate(feature.screen)}
              style={{ backgroundColor: ["#FFF1F2", "#EFF6FF", "#F0FFF4", "#FFFBEB"][idx % 4], elevation: 3 }}
              className="w-[48%] h-36 mb-4 rounded-2xl shadow-md overflow-hidden"
            >
              <View className="p-3">
                <Text className="font-bold text-[16px] text-gray-800">{feature.title}</Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {idx === 0 ? "Try Outfits Virtually" : idx === 1 ? "AI created new looks" : idx === 2 ? "Instant try on" : "Find best colors"}
                </Text>
              </View>
              <Image
                source={{ uri: feature.image }}
                className="w-20 h-20 absolute bottom-[-3] right-[-1] rounded-lg"
                style={{ transform: [{ rotate: "12deg" }], opacity: 0.9 }}
                resizeMode="cover"
              />
            </Pressable>
          ))}
        </View>

        <View className="flex-row items-center justify-between mt-6 px-4">
          <Text className="text-lg font-semibold">Popular this week</Text>
          <Text className="text-gray-500">More</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 pl-4 pb-6" nestedScrollEnabled>
          {popularItems.map((item, idx) => (
            <View key={idx} className="w-36 mr-4">
              <Image className="w-36 h-44 rounded-lg" source={{ uri: item.image }} />
              <View className="flex-row items-center mt-2">
                <Image className="w-6 h-6 rounded-full mr-2" source={{ uri: item.profile }} />
                <Text className="text-xs font-medium">{item.username}</Text>
              </View>
              <Text className="text-xs text-gray-500 mt-1">{item.itemName}</Text>
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Search Modal */}
      <Modal visible={showSearch} animationType="slide">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(""); }}>
              <Ionicons name="close" size={28} color="black" />
            </TouchableOpacity>
            <TextInput
              className="flex-1 ml-3 text-base"
              placeholder="Search shirts, pants, shoes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
          <ScrollView className="flex-1 px-4">
            {searchQuery.trim() === "" ? (
              <Text className="text-gray-500 mt-4">Type to search your wardrobe</Text>
            ) : searchResults.length === 0 ? (
              <Text className="text-gray-500 mt-4">No clothes found for "{searchQuery}"</Text>
            ) : (
              <View className="flex-row flex-wrap mt-2">
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    className="w-1/3 p-2"
                    onPress={() => {
                      setShowSearch(false);
                      setSearchQuery("");
                      navigation.navigate("AddOutfit", {
                        date: moment().format("ddd, Do MMM"),
                        savedOutfits: getSavedOutfitsForNav(),
                        preselectedIds: [item.id],
                      });
                    }}
                  >
                    <Image source={{ uri: item.image }} resizeMode="contain" style={{ width: "100%", height: 100, backgroundColor: "#f9f9f9", borderRadius: 8 }} />
                    <Text className="text-xs text-center mt-1 capitalize">{item.type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Upgrade Modal */}
      <Modal visible={showUpgrade} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">Upgrade to Pro</Text>
              <TouchableOpacity onPress={() => setShowUpgrade(false)}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            {["Unlimited outfit saves", "AI stylist priority", "Virtual try-on HD", "No ads"].map((f) => (
              <View key={f} className="flex-row items-center mb-3">
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text className="ml-2 text-base">{f}</Text>
              </View>
            ))}
            <TouchableOpacity
              className="bg-black py-3 rounded-lg mt-4 items-center"
              onPress={() => { setShowUpgrade(false); Alert.alert("Upgrade", "Pro plan coming soon!"); }}
            >
              <Text className="text-white font-semibold">Get Pro — $4.99/mo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Story View Modal */}
      <Modal visible={showStory} animationType="fade" transparent onRequestClose={() => setShowStory(false)}>
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1, backgroundColor: "#000" }}
          onPress={() => setShowStory(false)}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <TouchableOpacity style={{ position: "absolute", top: 48, right: 16, zIndex: 10 }} onPress={() => setShowStory(false)}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            {activeStory && (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
                <Image source={{ uri: activeStory.avatar }} style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 16 }} />
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>{activeStory.username}</Text>
                <Text style={{ color: "#ccc", marginTop: 8, textAlign: "center" }}>Check out today's outfit inspiration!</Text>
                <TouchableOpacity
                  style={{ backgroundColor: "#fff", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 24 }}
                  onPress={() => { setShowStory(false); navigation.navigate("AIOutfit"); }}
                >
                  <Text style={{ fontWeight: "600" }}>Get Similar Looks</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>

      {/* Day Outfit Edit/Delete Modal */}
      <Modal visible={showDayModal} animationType="slide" transparent onRequestClose={() => setShowDayModal(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-lg font-bold mb-1">{selectedDay?.label}</Text>
            <Text className="text-gray-500 mb-4">Saved outfit for this day</Text>
            {selectedDay?.outfit && (
              <View className="flex-row justify-center mb-4">
                {selectedDay.outfit.items.slice(0, 3).map((item: any, i: number) => (
                  <Image key={i} source={{ uri: item.image }} style={{ width: 70, height: 70, marginHorizontal: 4 }} resizeMode="contain" />
                ))}
              </View>
            )}
            <TouchableOpacity className="bg-black py-3 rounded-lg mb-3 items-center" onPress={handleEditOutfit}>
              <Text className="text-white font-semibold">Edit Outfit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-100 py-3 rounded-lg mb-3 items-center"
              onPress={() => {
                setShowDayModal(false);
                navigation.navigate("NewOutfit", {
                  selectedItems: selectedDay?.outfit?.items || [],
                  date: selectedDay?.label,
                  savedOutfits: getSavedOutfitsForNav(),
                  editOutfitId: selectedDay?.outfit?._id,
                });
              }}
            >
              <Text className="font-semibold">View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-red-50 py-3 rounded-lg items-center"
              onPress={handleDeleteOutfit}
              disabled={deleting}
            >
              <Text className="text-red-600 font-semibold">
                {deleting ? "Deleting..." : "Delete Outfit"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="py-3 items-center mt-2" onPress={() => setShowDayModal(false)}>
              <Text className="text-gray-500">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({});
