import React from "react";
import { Image, Platform, StyleSheet, View, ViewStyle } from "react-native";

type Props = {
  uri: string;
  color?: string | null;
  style?: ViewStyle;
  imageStyle?: object;
  /** When true, tints only the garment pixels (not the card background) */
  recolorGarment?: boolean;
};

/**
 * Recolors clothing PNGs by tinting opaque pixels only.
 * Transparent areas stay clear — no background color wash.
 */
const TintedClothingImage = ({
  uri,
  color,
  style,
  imageStyle,
  recolorGarment = true,
}: Props) => {
  const hasColor = Boolean(color);

  if (!hasColor) {
    return (
      <View style={[styles.wrap, style]}>
        <Image source={{ uri }} style={[styles.image, imageStyle]} resizeMode="contain" />
      </View>
    );
  }

  if (recolorGarment) {
    return (
      <View style={[styles.wrap, style]}>
        <Image
          source={{ uri }}
          style={[
            styles.image,
            imageStyle,
            { tintColor: color! },
            Platform.OS === "web" ? ({ filter: "saturate(1.2)" } as object) : null,
          ]}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <Image source={{ uri }} style={[styles.image, imageStyle]} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
});

export default TintedClothingImage;
