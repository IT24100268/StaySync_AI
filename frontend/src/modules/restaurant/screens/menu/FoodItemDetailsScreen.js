import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import EmptyState from "../../../../components/common/EmptyState";
import AppButton from "../../../../components/common/AppButton";
import { useMenu } from "../../context/MenuContext";
import { appTheme } from "../../../../theme";
import { formatCurrency } from "../../../../utils/format";
import StatusBadge from "../../components/cards/StatusBadge";
import ConfirmationModal from "../../components/form/ConfirmationModal";

export default function FoodItemDetailsScreen({ route, navigation }) {
  const { foodId } = route.params || {};
  const { menuItems, removeFoodItem, toggleAvailability } = useMenu();
  const [showDelete, setShowDelete] = useState(false);
  const item = menuItems.find((entry) => entry.id === foodId);

  if (!item) {
    return (
      <ScreenContainer>
        <EmptyState title="Food item unavailable" description="The selected food item could not be found." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color={appTheme.colors.text} />
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.title}>{item.name}</Text>
          <StatusBadge status={item.availability} />
        </View>
        <Text style={styles.meta}>{item.category}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.price}>{formatCurrency(item.price)}</Text>
      </View>
      <AppButton title="Edit Item" onPress={() => navigation.navigate("EditFoodItem", { foodId: item.id })} />
      <AppButton title={item.availability === "in_stock" ? "Mark Out of Stock" : "Mark In Stock"} variant="secondary" onPress={() => toggleAvailability(item.id)} />
      <AppButton title="Delete Item" variant="secondary" onPress={() => setShowDelete(true)} />

      <ConfirmationModal
        visible={showDelete}
        title="Delete Food Item"
        message="Are you sure you want to remove this menu item permanently?"
        confirmLabel="Delete"
        onConfirm={async () => {
          await removeFoodItem(item.id);
          setShowDelete(false);
          navigation.goBack();
        }}
        onCancel={() => setShowDelete(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  backButtonText: {
    color: appTheme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: appTheme.radius.lg,
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
    ...appTheme.shadow,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  meta: {
    color: appTheme.colors.textMuted,
  },
  description: {
    color: appTheme.colors.textMuted,
    lineHeight: 22,
  },
  price: {
    color: "#B9481B",
    fontWeight: "800",
    fontSize: 18,
  },
});
