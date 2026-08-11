import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import moment from "moment";
import { API_BASE_URL } from "../config/api";
import { getAllClothes } from "../utils/clothes";

type WardrobeItem = {
  id: number;
  name: string;
  type: string;
  image: string;
  link: string;
  shopLink: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  wardrobeItems?: WardrobeItem[];
};

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm **Fits AI** — your personal fashion stylist. 👗\n\nI pick outfits directly from **your wardrobe collection** and share links to each item.\n\nTry: \"Suggest a coffee date outfit from my wardrobe\"",
};

const QUICK_SUGGESTIONS = [
  "Outfit from my wardrobe for work 💼",
  "Coffee date look from my collection ☕",
  "Party outfit using my clothes 🎉",
  "Casual weekend outfit from wardrobe",
  "Date night look from my closet 💕",
];

const AIAssistant = () => {
  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const wearOutfit = (items: WardrobeItem[]) => {
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

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const apiMessages = updatedMessages
        .filter((m) => m.id !== "welcome" || updatedMessages.length > 1)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await axios.post(`${API_BASE_URL}/fashion-chat`, {
        messages: apiMessages,
      });

      const reply =
        response.data?.reply ||
        "I'm having trouble right now. Try asking about a specific outfit or occasion!";
      const wardrobeItems: WardrobeItem[] = response.data?.wardrobeItems || [];

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: reply,
          wardrobeItems,
        },
      ]);
    } catch (error: any) {
      console.error("Fashion chat error:", error);
      const is404 = error?.response?.status === 404;
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: is404
            ? "⚠️ Restart API server: cd api && npm run dev"
            : "Sorry, couldn't reach the stylist server. Run: cd api && npm run dev",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (content: string) => {
    const withoutLinks = content.split("\n").filter((line) => !line.trim().startsWith("http"));
    const text = withoutLinks.join("\n").replace(/---/g, "").trim();
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <Text key={i} style={{ fontWeight: "700" }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return <Text key={i}>{part}</Text>;
    });
  };

  const WardrobeCards = ({ items }: { items: WardrobeItem[] }) => (
    <View style={styles.wardrobeSection}>
      <Text style={styles.wardrobeTitle}>👗 From your wardrobe</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {items.map((item) => (
          <View key={`${item.id}-${item.name}`} style={styles.wardrobeCard}>
            <Image source={{ uri: item.image }} style={styles.wardrobeImg} resizeMode="contain" />
            <Text style={styles.wardrobeName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.wardrobeType}>{item.type}</Text>
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => Linking.openURL(item.link || item.image)}
            >
              <Ionicons name="image-outline" size={14} color="#6366f1" />
              <Text style={styles.linkBtnText}>View item</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.linkBtn, styles.shopBtn]}
              onPress={() => Linking.openURL(item.shopLink)}
            >
              <Ionicons name="cart-outline" size={14} color="#fff" />
              <Text style={[styles.linkBtnText, { color: "#fff" }]}>Shop online</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.wearBtn} onPress={() => wearOutfit(items)}>
        <Ionicons name="shirt-outline" size={18} color="#fff" />
        <Text style={styles.wearBtnText}>Wear this outfit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.avatarSmall}>
            <Text style={{ fontSize: 16 }}>✨</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Fits AI Stylist</Text>
            <Text style={styles.headerSub}>Uses your wardrobe • Online</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setMessages([INITIAL_MESSAGE])} style={styles.backBtn}>
          <Ionicons name="refresh-outline" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <View key={msg.id}>
              <View
                style={[
                  styles.row,
                  msg.role === "user" ? styles.rowUser : styles.rowAi,
                ]}
              >
                {msg.role === "assistant" && (
                  <View style={styles.avatarAi}>
                    <Text style={{ fontSize: 14 }}>👗</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    msg.role === "user" ? styles.bubbleUser : styles.bubbleAi,
                    msg.wardrobeItems?.length ? styles.bubbleWide : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      msg.role === "user" && styles.bubbleTextUser,
                    ]}
                  >
                    {renderContent(msg.content)}
                  </Text>
                </View>
              </View>
              {msg.wardrobeItems && msg.wardrobeItems.length > 0 && (
                <View style={styles.wardrobeWrap}>
                  <WardrobeCards items={msg.wardrobeItems} />
                </View>
              )}
            </View>
          ))}

          {isLoading && (
            <View style={[styles.row, styles.rowAi]}>
              <View style={styles.avatarAi}>
                <Text style={{ fontSize: 14 }}>👗</Text>
              </View>
              <View style={[styles.bubble, styles.bubbleAi, styles.typingBubble]}>
                <ActivityIndicator size="small" color="#6366f1" />
                <Text style={styles.typingText}>Picking from your wardrobe...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.suggestionsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {QUICK_SUGGESTIONS.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.chip}
                onPress={() => sendMessage(s)}
                disabled={isLoading}
              >
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask for outfit from my wardrobe..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage(input)}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AIAssistant;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: { padding: 6, width: 36 },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  headerSub: { fontSize: 11, color: "#22c55e", marginTop: 1 },
  chatArea: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 8 },
  row: { flexDirection: "row", marginBottom: 6, alignItems: "flex-end" },
  rowUser: { justifyContent: "flex-end" },
  rowAi: { justifyContent: "flex-start" },
  avatarAi: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleWide: { maxWidth: "90%" },
  bubbleUser: {
    backgroundColor: "#6366f1",
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#eee",
  },
  bubbleText: { fontSize: 15, lineHeight: 22, color: "#1a1a1a" },
  bubbleTextUser: { color: "#fff" },
  typingBubble: { flexDirection: "row", alignItems: "center", gap: 8 },
  typingText: { fontSize: 13, color: "#666" },
  wardrobeWrap: { marginLeft: 38, marginBottom: 14, marginRight: 8 },
  wardrobeSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  wardrobeTitle: { fontSize: 14, fontWeight: "700", marginBottom: 10, color: "#111" },
  wardrobeCard: {
    width: 130,
    marginRight: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  wardrobeImg: { width: "100%", height: 90, borderRadius: 8, backgroundColor: "#fff" },
  wardrobeName: { fontSize: 12, fontWeight: "600", marginTop: 6, color: "#111" },
  wardrobeType: { fontSize: 10, color: "#888", textTransform: "capitalize", marginBottom: 6 },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: "#ede9fe",
    marginBottom: 4,
  },
  shopBtn: { backgroundColor: "#6366f1" },
  linkBtnText: { fontSize: 11, color: "#6366f1", fontWeight: "600" },
  wearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#111",
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  wearBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  suggestionsWrap: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  chip: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chipText: { fontSize: 13, color: "#374151" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: "#f3f4f6",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#c7c9f0" },
});
