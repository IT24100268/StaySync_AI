import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import EmptyState from "../../../../components/common/EmptyState";
import LoadingOverlay from "../../../../components/common/LoadingOverlay";
import FoodItemCard from "../../components/cards/FoodItemCard";
import ConfirmationModal from "../../components/form/ConfirmationModal";
import { useMenu } from "../../context/MenuContext";
import { appTheme } from "../../../../theme";

export default function MenuListScreen({ navigation }) {
  const { menuItems, loading, removeFoodItem, toggleAvailability, loadMenu } = useMenu();
  const [deletingId, setDeletingId] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      loadMenu();
    }, [loadMenu])
  );

  if (loading) return <LoadingOverlay />;

  return (
    <ScreenContainer>
      <Text style={styles.addButton} onPress={() => navigation.navigate("AddFoodItem")}>
        + Add Food Item
      </Text>
      {menuItems.length === 0 ? (
        <EmptyState title="No menu items yet" description="Add your first food item to start receiving orders." icon="restaurant-outline" />
      ) : (
        menuItems.map((item) => (
          <FoodItemCard
            key={item.id}
            item={item}
            onPress={() => navigation.navigate("FoodItemDetails", { foodId: item.id })}
            onEdit={() => navigation.navigate("EditFoodItem", { foodId: item.id })}
            onToggle={() => toggleAvailability(item.id)}
            onDelete={() => setDeletingId(item.id)}
          />
        ))
      )}

      <ConfirmationModal
        visible={Boolean(deletingId)}
        title="Delete Food Item"
        message="Are you sure you want to remove this menu item?"
        confirmLabel="Delete"
        onConfirm={async () => {
          await removeFoodItem(deletingId);
          setDeletingId("");
        }}
        onCancel={() => setDeletingId("")}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  addButton: {
    textAlign: "center",
    backgroundColor: "#B9481B",
    color: "#FFFFFF",
    paddingVertical: appTheme.spacing.md,
    borderRadius: appTheme.radius.md,
    fontWeight: "700",
    overflow: "hidden",
  },
});
