import { create } from "zustand";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,

  initializeAuth: async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        set({ token, isAuthenticated: true });
        await useAuthStore.getState().fetchUser()
      }
    } catch (err) {
      console.error("Auth initialization failed", err);
    }
  },

  register: async (email, password, username, gender, profileImage) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${BASE_URL}/register`, {
        email,
        password,
        username,
        gender,
        profileImage,
      });
      console.log("data",response.data)
      const { token } = response.data;
      await AsyncStorage.setItem("userToken", token);
      set({ token, loading: false, isAuthenticated: true });
      await useAuthStore.getState().fetchUser()
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || "Registration failed";
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  login: async (email,password) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${BASE_URL}/login`, {
        email,
        password,
      });
      const { token } = response.data;
      console.log("token",response.data)
      await AsyncStorage.setItem("userToken", token);
      set({ token, loading: false, isAuthenticated: true });
      await useAuthStore.getState().fetchUser()
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || "Login failed";
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },
  logout: async () => {
    await AsyncStorage.removeItem("userToken");
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      console.log("da", token);
      if (!token) {
        set({ user: null, error: "No token available" });
        return;
      }
      const response = await axios.get(`${BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ user: response.data, error: null });
    } catch (err) {
      console.error("Failed to fetch user:", err);
      set({
        user: null,
        error: err.response?.data?.error || "Failed to fetch user",
      });
    }
  },

  updateProfile: async (updates) => {
    set({ loading: true, error: null });
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.put(`${BASE_URL}/me`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ user: response.data, loading: false, error: null });
      return response.data;
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || "Update failed";
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },
}));

export default useAuthStore;
