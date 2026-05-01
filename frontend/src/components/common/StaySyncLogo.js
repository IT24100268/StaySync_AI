import React from "react";
import { Image, StyleSheet, View } from "react-native";

const LOGO_IMAGE = require("../../../assets/Logo.png");

export default function StaySyncLogo({ size = 58 }) {
  return (
    <View
      style={[
        styles.logoWrap,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Image
        source={LOGO_IMAGE}
        style={[
          styles.logoImage,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  logoImage: {
    overflow: "hidden",
  },
});
