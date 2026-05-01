import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../theme";
import { formatCurrency, formatDistance } from "../../utils/format";

export default function RoomCard({ room, isFavourite, onPress, onToggleFavourite }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: room.images[0] }} style={styles.image} />
      <Pressable style={styles.favourite} onPress={onToggleFavourite}>
        <Ionicons
          name={isFavourite ? "heart" : "heart-outline"}
          size={20}
          color={isFavourite ? appTheme.colors.danger : appTheme.colors.text}
        />
      </Pressable>
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.title}>{room.title}</Text>
          <Text style={styles.price}>{formatCurrency(room.price)}</Text>
        </View>
        <Text style={styles.meta}>
          {room.location} • {formatDistance(room.distance)}
        </Text>
        <Text style={styles.meta}>Allowed: {room.genderAllowed}</Text>
        <View style={styles.facilityRow}>
          {room.facilities.slice(0, 3).map((facility) => (
            <View key={facility} style={styles.badge}>
              <Text style={styles.badgeLabel}>{facility}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    overflow: "hidden",
    ...appTheme.shadow,
  },
  image: {
    width: "100%",
    height: 180,
  },
  favourite: {
    position: "absolute",
    top: appTheme.spacing.md,
    right: appTheme.spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  price: {
    color: appTheme.colors.primary,
    fontWeight: "700",
  },
  meta: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
  },
  facilityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: appTheme.spacing.xs,
  },
  badge: {
    backgroundColor: appTheme.colors.chipBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: appTheme.radius.pill,
    marginRight: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.sm,
  },
  badgeLabel: {
    color: appTheme.colors.primaryDark,
    fontSize: 12,
    fontWeight: "600",
  },
});
