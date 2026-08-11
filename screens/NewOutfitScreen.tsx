import {

  ActivityIndicator,

  Alert,

  Image,

  SafeAreaView,

  StyleSheet,

  Switch,

  Text,

  TextInput,

  TouchableOpacity,

  View,

} from "react-native";

import React, { useEffect, useState } from "react";

import { useNavigation, useRoute } from "@react-navigation/native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { jwtDecode } from "jwt-decode";

import axios from "axios";

import { API_BASE_URL } from "../config/api";
import { confirmDelete } from "../utils/confirm";



interface ClothingItem {

  id: number;

  image: string;

  x: number;

  y: number;

  type?: "pants" | "shoes" | "shirt" | "skirts" | "selfie";

  gender?: "m" | "f" | "unisex";

}



const NewOutfitScreen = () => {

  const route = useRoute();

  const {

    selectedItems,

    date,

    savedOutfits,

    backgroundColor,

    editOutfitId,

  } = route.params as {

    selectedItems: ClothingItem[];

    date: string;

    savedOutfits: Record<string, any[]>;

    backgroundColor?: string;

    editOutfitId?: string;

  };

  const navigation = useNavigation<any>();

  const [caption, setCaption] = useState("");

  const [isOotd, setIsOotd] = useState(false);

  const [occasion, setOcassion] = useState("Work");

  const [visibility, setVisibility] = useState("Everyone");

  const [loading, setLoading] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);



  useEffect(() => {

    const fetchToken = async () => {

      try {

        const token = await AsyncStorage.getItem("userToken");

        if (token) {

          const decoded = jwtDecode(token) as { id: string };

          setUserId(decoded.id);

        } else {

          Alert.alert("Error", "No authentication token found");

        }

      } catch (error) {

        Alert.alert("Error", "Failed to authenticate");

      }

    };

    fetchToken();

  }, []);



  const handleSave = async () => {

    if (!userId) {

      Alert.alert("Error", "User not authenticated");

      return;

    }

    setLoading(true);

    try {

      const validItems = selectedItems.map((item) => ({

        id: item.id,

        type: item?.type || "shirt",

        image: item.image,

        x: item.x || 0,

        y: item.y || 0,

      }));



      if (validItems.length === 0) {

        throw new Error("No valid items to save");

      }



      const outfitData = {

        userId,

        date,

        items: validItems,

        caption,

        occasion,

        visibility,

        isOotd,

      };



      const token = await AsyncStorage.getItem("userToken");

      let response;



      if (editOutfitId) {

        response = await axios.put(

          `${API_BASE_URL}/save-outfit/${editOutfitId}`,

          outfitData,

          { headers: { Authorization: `Bearer ${token}` } }

        );

      } else {

        response = await axios.post(`${API_BASE_URL}/save-outfit`, outfitData, {

          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,

          },

        });

      }



      const saved = response.data.outfit;

      const updatedOutfits = {

        ...savedOutfits,

        [date]: {

          _id: saved._id,

          date: saved.date,

          items: saved.items,

          caption: saved.caption,

          occasion: saved.occasion,

        },

      };



      navigation.reset({

        index: 0,

        routes: [

          {

            name: "Tabs",

            state: {

              routes: [{ name: "Home", params: { savedOutfits: updatedOutfits } }],

            },

          },

        ],

      });

    } catch (error: any) {

      const message =

        error?.response?.data?.error || error?.message || "Failed to save outfit";

      Alert.alert("Save Failed", message);

    } finally {

      setLoading(false);

    }

  };



  const handleDelete = () => {
    if (!editOutfitId && !date) return;
    confirmDelete(`Remove outfit for ${date}?`, async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("userToken");
        const headers = { Authorization: `Bearer ${token}` };
        if (editOutfitId) {
          await axios.delete(`${API_BASE_URL}/save-outfit/${editOutfitId}`, { headers });
        } else {
          await axios.delete(
            `${API_BASE_URL}/save-outfit/by-date/${encodeURIComponent(date)}`,
            { headers }
          );
        }
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "Tabs",
              state: {
                routes: [{ name: "Home", params: { refreshOutfits: Date.now() } }],
              },
            },
          ],
        });
      } catch {
        Alert.alert("Error", "Failed to delete outfit");
      } finally {
        setLoading(false);
      }
    });
  };



  return (

    <SafeAreaView className="flex-1 bg-white">

      <View className="flex-row justify-between items-center p-4">

        <TouchableOpacity onPress={() => navigation.goBack()}>

          <Text className="text-black">Back</Text>

        </TouchableOpacity>

        <Text className="text-lg font-semibold">

          {editOutfitId ? "Edit Outfit" : "New Outfit"}

        </Text>

        {editOutfitId ? (

          <TouchableOpacity onPress={handleDelete}>

            <Text className="text-red-600">Delete</Text>

          </TouchableOpacity>

        ) : (

          <View style={{ width: 50 }} />

        )}

      </View>

      <View

        className="flex-1 items-center justify-center"

        style={{ backgroundColor: backgroundColor || "#ffffff" }}

      >

        {selectedItems

          ?.sort((a, b) => {

            const order: Record<string, number> = { shirt: 1, skirts: 2, pants: 3, shoes: 4, selfie: 0 };

            return (order[a.type || ""] || 5) - (order[b.type || ""] || 5);

          })

          .map((item, index) => (

            <Image

              resizeMode="contain"

              key={`${item.id}-${index}`}

              source={{ uri: item?.image }}

              style={{

                width: 240,

                height: item?.type == "shoes" ? 180 : 240,

                marginBottom: index < selectedItems.length - 1 ? -60 : 0,

              }}

            />

          ))}

      </View>

      <View className="p-4">

        <Text className="text-sm text-gray-400 mb-2">Date: {date}</Text>

        <TextInput

          className="border-b border-gray-300 pb-2 text-gray-500"

          placeholder="Add a caption..."

          value={caption}

          onChangeText={setCaption}

        />

        <View className="mt-4">

          <View className="flex-row items-center justify-between mt-2">

            <Text className="text-gray-500">Add to OOTD story</Text>

            <Switch value={isOotd} onValueChange={setIsOotd} />

          </View>

          <View className="flex-row items-center justify-between mt-2">

            <Text className="text-gray-500">Occasion</Text>

            <Text className="text-black">{occasion}</Text>

          </View>

          <View className="flex-row items-center justify-between mt-2">

            <Text className="text-gray-500">Visibility</Text>

            <Text className="text-black">{visibility}</Text>

          </View>

        </View>

      </View>

      <TouchableOpacity

        className="bg-black py-3 mx-4 mb-4 rounded"

        onPress={handleSave}

        disabled={loading}

      >

        {loading ? (

          <ActivityIndicator color="#ffffff" />

        ) : (

          <Text className="text-white text-center font-semibold">

            {editOutfitId ? "Update outfit" : "Save outfit"}

          </Text>

        )}

      </TouchableOpacity>

    </SafeAreaView>

  );

};



export default NewOutfitScreen;



const styles = StyleSheet.create({});


