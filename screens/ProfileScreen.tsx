import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import useAuthStore from "../store/auth";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { COLLECTIONS, getMergedClothes, TYPE_LABELS } from "../utils/clothes";
import { confirmDelete } from "../utils/confirm";
import * as ImagePicker from "expo-image-picker";
import moment from "moment";
import { useNavigation } from "@react-navigation/native";
import { useWardrobeStore } from "../store/wardrobeStore";
import TintedClothingImage from "../components/TintedClothingImage";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Clothes");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const { logout, user, token, updateProfile } = useAuthStore();
  const [outifts, setOutfits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editProfileImage, setEditProfileImage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [showAddCloth, setShowAddCloth] = useState(false);
  const [addClothStep, setAddClothStep] = useState<"type" | "photo" | "name">("type");
  const [newClothType, setNewClothType] = useState("");
  const [newClothImage, setNewClothImage] = useState("");
  const [newClothName, setNewClothName] = useState("");
  const [savingCloth, setSavingCloth] = useState(false);

  const customClothes = useWardrobeStore((s) => s.customClothes);
  const addCustomCloth = useWardrobeStore((s) => s.addCustomCloth);
  const removeCustomCloth = useWardrobeStore((s) => s.removeCustomCloth);

  const username = user?.username || "sujanand";
  const email = user?.email || "";
  const followersCount = user?.followers?.length || 0;
  const followingCount = user?.following?.length || 0;
  const profileImage = user?.profileImage || "https://picsum.photos/100/100";

  const popularClothes = useMemo(() => getMergedClothes(), [customClothes]);

  const CLOTH_TYPE_OPTIONS = [
    { key: "shirt", label: "Shirt", icon: "shirt-outline" as const },
    { key: "pants", label: "Pants", icon: "body-outline" as const },
    { key: "shoes", label: "Shoes", icon: "footsteps-outline" as const },
  ];

  const resetAddCloth = () => {
    setShowAddCloth(false);
    setAddClothStep("type");
    setNewClothType("");
    setNewClothImage("");
    setNewClothName("");
  };

  const openAddCloth = () => {
    resetAddCloth();
    setShowAddCloth(true);
  };

  const selectClothType = (type: string) => {
    setNewClothType(type);
    setNewClothName(`My ${TYPE_LABELS[type] || type}`);
    setAddClothStep("photo");
  };

  const pickClothImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow camera or photo access.");
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });
    if (!result.canceled && result.assets[0]) {
      setNewClothImage(result.assets[0].uri);
      setAddClothStep("name");
    }
  };

  const handleSaveCloth = async () => {
    if (!newClothType || !newClothImage) {
      Alert.alert("Missing info", "Please select type and add a photo.");
      return;
    }
    setSavingCloth(true);
    try {
      const gender =
        user?.gender === "male" ? "m" : user?.gender === "female" ? "f" : "unisex";
      await addCustomCloth({
        image: newClothImage,
        type: newClothType,
        gender,
        name: newClothName.trim() || `My ${TYPE_LABELS[newClothType]}`,
      });
      resetAddCloth();
      Alert.alert("Saved!", "Your cloth has been added to your wardrobe.");
    } catch {
      Alert.alert("Error", "Could not save clothing item.");
    } finally {
      setSavingCloth(false);
    }
  };

  const handleDeleteCloth = (id: string, name: string) => {
    confirmDelete(`Remove "${name}" from your wardrobe?`, async () => {
      await removeCustomCloth(id);
    });
  };

  useEffect(() => {
    const fetchOutfits = async () => {
      if (!user?._id || !token) return;
      setLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/save-outfit/user/${user._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOutfits(response.data);
      } catch (error) {
        console.log("Error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOutfits();
  }, [user?._id, token]);

  const filteredClothes =
    activeCategory === "All"
      ? popularClothes
      : popularClothes.filter((item) => {
          switch (activeCategory) {
            case "Tops":
              return item.type === "shirt";
            case "Bottoms":
              return item.type === "pants" || item.type === "skirts";
            case "Shoes":
              return item.type === "shoes";
            case "Outerwear":
              return false;
            default:
              return true;
          }
        });

  const sortItems = (items: any[]) => {
    const order = ["shirt", "pants", "skirts", "shoes"];
    return [...items].sort(
      (a, b) => order.indexOf(a.type) - order.indexOf(b.type)
    );
  };

  const handleEditOutfit = (outfit: any) => {
    const allClothes = getMergedClothes();
    const preselectedIds = outfit.items
      .map((item: any) => allClothes.find((c) => c.image === item.image)?.id)
      .filter(Boolean) as (number | string)[];
    const savedMap = outifts.reduce((acc: Record<string, any[]>, o: any) => {
      acc[o.date] = o.items;
      return acc;
    }, {});
    navigation.getParent()?.navigate("AddOutfit", {
      date: outfit.date,
      savedOutfits: savedMap,
      preselectedIds,
      editOutfitId: outfit._id,
    });
  };

  const handleDeleteOutfit = (outfit: any) => {
    confirmDelete(`Remove outfit for ${outfit.date}?`, async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        if (outfit._id) {
          await axios.delete(`${API_BASE_URL}/save-outfit/${outfit._id}`, { headers });
        } else {
          await axios.delete(
            `${API_BASE_URL}/save-outfit/by-date/${encodeURIComponent(outfit.date)}`,
            { headers }
          );
        }
        setOutfits((prev) => prev.filter((o) => o._id !== outfit._id && o.date !== outfit.date));
      } catch {
        Alert.alert("Error", "Failed to delete outfit");
      }
    });
  };

  const openEditProfile = () => {
    setEditUsername(username);
    setEditGender(user?.gender || "");
    setEditProfileImage(profileImage);
    setShowEditProfile(true);
  };

  const pickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow access to your photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setEditProfileImage(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      Alert.alert("Error", "Username cannot be empty");
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        username: editUsername.trim(),
        gender: editGender,
        profileImage: editProfileImage,
      });
      setShowEditProfile(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out ${username}'s wardrobe on Fits! 👗\n${outifts.length} saved outfits • ${popularClothes.length} clothing items`,
        title: `${username}'s Profile`,
      });
    } catch {
      Alert.alert("Share", `Share ${username}'s profile with friends!`);
    }
  };

  const handleCalendarDayPress = (dateLabel: string) => {
    setShowCalendar(false);
    const outfitDates = outifts.reduce((acc: Record<string, any[]>, o: any) => {
      acc[o.date] = o.items;
      return acc;
    }, {});
    navigation.getParent()?.navigate("AddOutfit", {
      date: dateLabel,
      savedOutfits: outfitDates,
    });
  };

  const calendarDates = () => {
    const today = moment().startOf("day");
    const dates = [];
    for (let i = -7; i <= 14; i++) {
      dates.push(today.clone().add(i, "days").format("ddd, Do MMM"));
    }
    return dates;
  };

  const collectionItems = selectedCollection
    ? popularClothes.filter(
        COLLECTIONS.find((c) => c.id === selectedCollection)?.filter || (() => true)
      )
    : [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView>
        <View className="flex-row items-center justify-between px-4 pt-2">
          <Text className="text-2xl font-bold">{username}</Text>
          <View className="flex-row gap-4 items-center">
            <TouchableOpacity onPress={() => setShowCalendar(true)}>
              <Ionicons name="calendar-outline" color="black" size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("ColorAnalysis")}>
              <Ionicons name="pie-chart-outline" color="black" size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowMenu(true)}>
              <Ionicons name="menu-outline" color="black" size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout}>
              <Ionicons name="power-outline" size={26} color="red" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center px-4 mt-4">
          <TouchableOpacity className="relative" onPress={openEditProfile}>
            <Image
              className="w-20 h-20 rounded-full"
              source={{ uri: profileImage }}
            />
            <View className="absolute bottom-0 right-0 bg-black rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-lg text-center">+</Text>
            </View>
          </TouchableOpacity>
          <View className="ml-4">
            <Text className="text-lg font-semibold">{username}</Text>
            <Text className="text-sm text-gray-500">{email}</Text>
            <View className="flex-row mt-1 gap-2">
              <Text className="text-gray-600">
                <Text className="font-bold">{followersCount}</Text> Followers
              </Text>
              <Text className="text-gray-600">
                <Text className="font-bold">{followingCount}</Text> Following
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row px-4 mt-4 gap-3">
          <TouchableOpacity
            className="flex-1 bg-gray-100 rounded-lg py-2 items-center"
            onPress={openEditProfile}
          >
            <Text className="font-medium">Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-gray-100 rounded-lg py-2 items-center"
            onPress={handleShareProfile}
          >
            <Text className="font-medium">Share Profile</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-around mt-5 border-b border-gray-300">
          {["Clothes", "Outfits", "Collections"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                setActiveTab(tab);
                setSelectedCollection(null);
              }}
              className="pb-2"
            >
              <Text
                className={`text-base font-medium ${
                  activeTab === tab ? "text-black" : "text-gray-400"
                }`}
              >
                {tab}
              </Text>
              {activeTab === tab && <View className="h-0.5 bg-black mt-2" />}
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "Clothes" && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3 pl-4"
            >
              {["All", "Tops", "Bottoms", "Shoes", "Outerwear"].map((cat) => (
                <TouchableOpacity
                  onPress={() => setActiveCategory(cat)}
                  key={cat}
                  className="px-3 mr-4 rounded-full"
                >
                  <Text
                    className={`text-base font-medium ${
                      activeCategory === cat ? "text-black" : "text-gray-400"
                    }`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View className="px-4 mt-3">
              <View className="flex-row flex-wrap">
                {filteredClothes.map((item) => (
                  <View className="w-1/3 p-1.5" key={String(item.id)}>
                    <View
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                      className="bg-white rounded-lg border border-gray-100 overflow-hidden"
                    >
                      <TintedClothingImage
                        uri={item.image}
                        color={item.color}
                        style={{ width: "100%", height: 128, backgroundColor: "#f9f9f9" }}
                      />
                      <View className="p-2">
                        <Text className="text-xs font-semibold text-gray-800" numberOfLines={1}>
                          {item.name || TYPE_LABELS[item.type] || item.type}
                        </Text>
                        <Text className="text-xs text-gray-500 capitalize mt-0.5">
                          {TYPE_LABELS[item.type] || item.type}
                          {item.isCustom ? " • Yours" : ""}
                        </Text>
                      </View>
                      {item.isCustom ? (
                        <TouchableOpacity
                          className="absolute top-1 right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center"
                          onPress={() => handleDeleteCloth(String(item.id), item.name || "item")}
                        >
                          <Ionicons name="close" size={12} color="#fff" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                ))}

                {/* Add button after last cloth */}
                <View className="w-1/3 p-1.5">
                  <TouchableOpacity
                    onPress={openAddCloth}
                    className="bg-white rounded-lg border-2 border-dashed border-gray-300 items-center justify-center"
                    style={{ height: 168 }}
                  >
                    <View className="w-12 h-12 rounded-full bg-black items-center justify-center">
                      <Ionicons name="add" size={28} color="#fff" />
                    </View>
                    <Text className="text-xs font-semibold text-gray-600 mt-2">Add Cloth</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {filteredClothes.length === 0 ? (
                <Text className="py-2 text-gray-500 text-center">
                  No clothes in this category. Tap + to add yours!
                </Text>
              ) : null}
            </View>
          </>
        )}

        {activeTab === "Outfits" && (
          <View className="px-2 mt-3">
            {loading ? (
              <ActivityIndicator size="large" color="#000" className="mt-8" />
            ) : outifts.length === 0 ? (
              <Text className="px-4 py-4">No outfits saved yet. Tap + to create one!</Text>
            ) : (
              <View className="flex-row flex-wrap">
                {outifts.map((outfit) => (
                  <View key={outfit._id} className="w-1/2 p-1.5">
                    <View className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                      {sortItems(outfit.items).map((item: any, index: number) => (
                        <Image
                          key={`${outfit._id}-${item.id}-${index}`}
                          source={{ uri: item.image }}
                          resizeMode="contain"
                          style={{ width: "100%", height: 120, marginVertical: -15 }}
                        />
                      ))}
                      <View className="p-3">
                        <Text className="text-sm font-semibold">{outfit.date}</Text>
                        <Text className="text-xs text-gray-600">{outfit.occasion}</Text>
                        <View className="flex-row mt-2 gap-2">
                          <TouchableOpacity
                            className="flex-1 bg-black py-1.5 rounded items-center"
                            onPress={() => handleEditOutfit(outfit)}
                          >
                            <Text className="text-white text-xs font-medium">Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="flex-1 bg-red-50 py-1.5 rounded items-center border border-red-200"
                            onPress={() => handleDeleteOutfit(outfit)}
                          >
                            <Text className="text-red-600 text-xs font-medium">Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === "Collections" && (
          <View className="px-4 mt-3">
            {!selectedCollection ? (
              COLLECTIONS.map((collection) => {
                const items = popularClothes.filter(collection.filter);
                return (
                  <TouchableOpacity
                    key={collection.id}
                    onPress={() => setSelectedCollection(collection.id)}
                    className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold">{collection.name}</Text>
                        <Text className="text-sm text-gray-500 mt-1">
                          {collection.description}
                        </Text>
                        <Text className="text-xs text-gray-400 mt-1">
                          {items.length} items
                        </Text>
                      </View>
                      <View className="flex-row">
                        {items.slice(0, 3).map((item, idx) => (
                          <Image
                            key={idx}
                            source={{ uri: item.image }}
                            style={{ width: 40, height: 40, marginLeft: -8 }}
                            resizeMode="contain"
                          />
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setSelectedCollection(null)}
                  className="flex-row items-center mb-3"
                >
                  <Ionicons name="chevron-back" size={20} color="black" />
                  <Text className="ml-1 font-medium">
                    {COLLECTIONS.find((c) => c.id === selectedCollection)?.name}
                  </Text>
                </TouchableOpacity>
                <View className="flex-row flex-wrap">
                  {collectionItems.map((item) => (
                    <View key={item.id} className="w-1/3 p-1.5">
                      <View className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                        <Image
                          source={{ uri: item.image }}
                          resizeMode="contain"
                          style={{ width: "100%", height: 110, backgroundColor: "#f9f9f9" }}
                        />
                        <Text className="text-xs text-center py-1 capitalize">{item.type}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl max-h-[75%] p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold">Outfit Calendar</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {calendarDates().map((dateLabel) => {
                const hasOutfit = outifts.some((o) => o.date === dateLabel);
                return (
                  <TouchableOpacity
                    key={dateLabel}
                    onPress={() => handleCalendarDayPress(dateLabel)}
                    className="flex-row justify-between items-center py-3 border-b border-gray-100"
                  >
                    <Text className="text-base">{dateLabel}</Text>
                    {hasOutfit ? (
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                        <Text className="text-sm text-green-600">Outfit saved</Text>
                      </View>
                    ) : (
                      <Text className="text-sm text-gray-400">Tap to plan</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Menu Modal */}
      <Modal visible={showMenu} animationType="fade" transparent>
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View className="absolute top-16 right-4 bg-white rounded-xl shadow-lg w-52 overflow-hidden">
            {[
              { label: "Settings", icon: "settings-outline", action: openEditProfile },
              { label: "Notifications", icon: "notifications-outline", action: () => Alert.alert("Notifications", "No new notifications") },
              { label: "Help & Support", icon: "help-circle-outline", action: () => Alert.alert("Help", "Contact support@fits.app") },
              { label: "About", icon: "information-circle-outline", action: () => Alert.alert("Fits", "Wardrobe Assistant v1.0") },
              { label: "Logout", icon: "log-out-outline", action: () => { setShowMenu(false); logout(); } },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => { setShowMenu(false); item.action(); }}
                className="flex-row items-center px-4 py-3 border-b border-gray-100"
              >
                <Ionicons name={item.icon as any} size={20} color="black" />
                <Text className="ml-3 text-base">{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Cloth Modal */}
      <Modal visible={showAddCloth} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-5 pb-8 max-h-[85%]">
            <View className="items-center mb-4">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
              <Text className="text-lg font-bold mt-3">Add to My Clothes</Text>
              <Text className="text-sm text-gray-500 mt-1">
                {addClothStep === "type"
                  ? "What do you want to add?"
                  : addClothStep === "photo"
                  ? "Add a photo of your cloth"
                  : "Name your item"}
              </Text>
            </View>

            {addClothStep === "type" && (
              <View className="gap-3">
                {CLOTH_TYPE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => selectClothType(opt.key)}
                    className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-4"
                  >
                    <View className="w-10 h-10 rounded-full bg-black items-center justify-center mr-3">
                      <Ionicons name={opt.icon} size={22} color="#fff" />
                    </View>
                    <Text className="text-base font-semibold flex-1">{opt.label}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {addClothStep === "photo" && (
              <View className="gap-3">
                <View className="bg-indigo-50 rounded-xl px-4 py-3 mb-1">
                  <Text className="text-sm text-indigo-700 font-medium">
                    Adding: {TYPE_LABELS[newClothType] || newClothType}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => pickClothImage(true)}
                  className="flex-row items-center bg-black rounded-xl px-4 py-4"
                >
                  <Ionicons name="camera" size={24} color="#fff" />
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-semibold">Take Photo</Text>
                    <Text className="text-gray-300 text-xs">Use camera</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => pickClothImage(false)}
                  className="flex-row items-center bg-gray-100 border border-gray-200 rounded-xl px-4 py-4"
                >
                  <Ionicons name="images-outline" size={24} color="#111" />
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold">Upload from Gallery</Text>
                    <Text className="text-gray-500 text-xs">Pick existing photo</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAddClothStep("type")} className="py-2 items-center">
                  <Text className="text-gray-500">← Back to type</Text>
                </TouchableOpacity>
              </View>
            )}

            {addClothStep === "name" && (
              <View>
                <View className="items-center mb-4">
                  <Image
                    source={{ uri: newClothImage }}
                    style={{ width: 140, height: 140, borderRadius: 12, backgroundColor: "#f9f9f9" }}
                    resizeMode="contain"
                  />
                  <View className="mt-2 bg-gray-100 px-3 py-1 rounded-full">
                    <Text className="text-xs font-semibold capitalize">
                      {TYPE_LABELS[newClothType] || newClothType}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm text-gray-500 mb-1">Item name</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-base mb-4"
                  value={newClothName}
                  onChangeText={setNewClothName}
                  placeholder="e.g. My favorite shirt"
                />
                <TouchableOpacity
                  onPress={handleSaveCloth}
                  disabled={savingCloth}
                  className="bg-black rounded-xl py-4 items-center mb-2"
                >
                  <Text className="text-white font-bold text-base">
                    {savingCloth ? "Saving..." : "Save to My Clothes"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAddClothStep("photo")}
                  className="py-2 items-center"
                >
                  <Text className="text-gray-500">← Change photo</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={resetAddCloth} className="mt-4 py-2 items-center">
              <Text className="text-gray-400">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="slide">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowEditProfile(false)}>
              <Text className="text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={savingProfile}>
              <Text className="text-base font-semibold text-blue-600">
                {savingProfile ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="items-center mt-6">
            <TouchableOpacity onPress={pickProfileImage}>
              <Image
                source={{ uri: editProfileImage || profileImage }}
                className="w-24 h-24 rounded-full"
              />
              <Text className="text-sm text-blue-600 mt-2 text-center">Change Photo</Text>
            </TouchableOpacity>
          </View>
          <View className="px-4 mt-6">
            <Text className="text-sm text-gray-500 mb-1">Username</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 text-base"
              value={editUsername}
              onChangeText={setEditUsername}
              placeholder="Username"
            />
            <Text className="text-sm text-gray-500 mb-1 mt-4">Gender</Text>
            <View className="flex-row gap-3">
              {["male", "female", "other"].map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setEditGender(g)}
                  className={`px-4 py-2 rounded-full border ${
                    editGender === g ? "bg-black border-black" : "border-gray-300"
                  }`}
                >
                  <Text className={editGender === g ? "text-white capitalize" : "text-gray-600 capitalize"}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text className="text-sm text-gray-500 mb-1 mt-4">Email</Text>
            <Text className="text-base text-gray-400 px-1">{email}</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({});
