import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import EmptyState from "../../../../components/common/EmptyState";
import LoadingOverlay from "../../../../components/common/LoadingOverlay";
import SectionHeader from "../../../../components/common/SectionHeader";
import SearchBar from "../../../admin/components/common/SearchBar";
import FoodItemCard from "../../components/cards/FoodItemCard";
import ConfirmationModal from "../../components/form/ConfirmationModal";
import { useMenu } from "../../context/MenuContext";
import { appTheme } from "../../../../theme";

export default function MenuListScreen({ navigation }) {
  const { menuItems, loading, removeFoodItem, toggleAvailability, loadMenu } = useMenu();
  const [deletingId, setDeletingId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const filteredMenuItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return menuItems;
    }

    return menuItems.filter((item) => {
      const category = item.category?.toLowerCase() || "";
      const description = item.description?.toLowerCase() || "";

      return (
        item.name?.toLowerCase().includes(normalizedQuery) ||
        category.includes(normalizedQuery) ||
        description.includes(normalizedQuery)
      );
    });
  }, [menuItems, searchQuery]);

  const groupedMenuItems = useMemo(() => {
    const groups = filteredMenuItems.reduce((accumulator, item) => {
      const category = item.category?.trim() || "Uncategorized";

      if (!accumulator[category]) {
        accumulator[category] = [];
      }

      accumulator[category].push(item);
      return accumulator;
    }, {});

    return Object.entries(groups).sort(([left], [right]) => left.localeCompare(right));
  }, [filteredMenuItems]);

  useFocusEffect(
    React.useCallback(() => {
      loadMenu();
    }, [loadMenu])
  );

  if (loading) return <LoadingOverlay />;

  return (
    <ScreenContainer>
      <Pressable style={styles.addFoodButton} onPress={() => navigation.navigate("AddFoodItem")}>
        <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
        <Text style={styles.addFoodButtonText}>Add Food Item</Text>
      </Pressable>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search food items by name or category"
      />

      {menuItems.length === 0 ? (
        <EmptyState title="No menu items yet" description="Add your first food item to start receiving orders." icon="restaurant-outline" />
      ) : filteredMenuItems.length === 0 ? (
        <EmptyState
          title="No matching food items"
          description="Try a different food name or category."
          icon="search-outline"
        />
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
  addFoodButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    borderRadius: 999,
    backgroundColor: "#B9481B",
  },
  addFoodButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  categorySection: {
    gap: appTheme.spacing.md,
  },
});
