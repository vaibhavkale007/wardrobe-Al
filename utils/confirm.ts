import { Alert, Platform } from "react-native";

export const confirmDelete = (
  message: string,
  onConfirm: () => void | Promise<void>
) => {
  if (Platform.OS === "web") {
    if (window.confirm(message)) {
      onConfirm();
    }
    return;
  }
  Alert.alert("Delete Outfit", message, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: () => onConfirm() },
  ]);
};
