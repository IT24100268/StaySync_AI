import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import EmptyState from "../../../../components/common/EmptyState";
import LoadingOverlay from "../../../../components/common/LoadingOverlay";
import SectionHeader from "../../../../components/common/SectionHeader";
import FoodItemCard from "../../components/cards/FoodItemCard";
import ConfirmationModal from "../../components/form/ConfirmationModal";
import { useMenu } from "../../context/MenuContext";
import { appTheme } from "../../../../theme";

export default function MenuListScreen({ navigation }) {
  const { menuItems, loading, removeFoodItem, toggleAvailability, loadMenu } = useMenu();
  const [deletingId, setDeletingId] = useState("");
  const groupedMenuItems = useMemo(() => {
    const groups = menuItems.reduce((accumulator, item) => {
      const category = item.category?.trim() || "Uncategorized";

      if (!accumulator[category]) {
        accumulator[category] = [];
      }

      accumulator[category].push(item);
      return accumulator;
    }, {});

    return Object.entries(groups).sort(([left], [right]) => left.localeCompare(right));
  }, [menuItems]);

  useFocusEffect(
    React.useCallback(() => {
      loadMenu();
    }, [loadMenu])
  );

  if (loading) return <LoadingOverlay />;

  return (
    <ScreenContainer>
      {menuItems.length === 0 ? (
        <EmptyState title="No menu items yet" description="Add your first food item to start receiving orders." icon="restaurant-outline" />
      ) : (
        groupedMenuItems.map(([category, items]) => (
          <View key={category} style={styles.categorySection}>
            <SectionHeader
              title={category}
              subtitle={`${items.length} item${items.length === 1 ? "" : "s"}`}
            />
            {items.map((item) => (
              <FoodItemCard
                key={item.id}
                item={item}
                onPress={() => navigation.navigate("FoodItemDetails", { foodId: item.id })}
                onEdit={() => navigation.navigate("EditFoodItem", { foodId: item.id })}
                onToggle={() => toggleAvailability(item.id)}
                onDelete={() => setDeletingId(item.id)}
              />
            ))}
          </View>
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
  categorySection: {
    gap: appTheme.spacing.md,
  },
});
