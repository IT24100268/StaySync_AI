import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../theme";
import { formatCurrency } from "../../utils/format";

export default function RecommendedRoomCard({ room, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: room.images[0] }} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={1}>
            {room.title}
          </Text>
          <Text style={styles.price}>{formatCurrency(room.price)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={appTheme.colors.textMuted} />
          <Text style={styles.meta} numberOfLines={1}>
            {room.location}
          </Text>
        </View>
        <View style={styles.badges}>
          {room.facilities.slice(0, 2).map((facility) => (
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
    width: 280,
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E6EEF4",
    ...appTheme.shadow,
  },
  image: {
    width: "100%",
    height: 152,
  },
  body: {
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.sm,
    alignItems: "flex-start",
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
    color: appTheme.colors.primary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  meta: {
    flex: 1,
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  badges: {
    flexDirection: "row",
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.xs,
  },
  badge: {
    backgroundColor: appTheme.colors.chipBg,
    borderRadius: appTheme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: appTheme.colors.primaryDark,
  },
});
