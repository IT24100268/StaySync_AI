import React, { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import ScreenContainer from "../../components/common/ScreenContainer";
import EmptyState from "../../components/common/EmptyState";
import SectionHeader from "../../components/common/SectionHeader";
import RoomCard from "../../components/room/RoomCard";
import { useRooms } from "../../context/RoomContext";

export default function RoomSearchScreen({ navigation }) {
  const { filteredRooms, favouriteRoomIds, toggleFavourite, clearFilters, loadRooms } = useRooms();

  useFocusEffect(
    useCallback(() => {
      clearFilters();
      loadRooms();
    }, [clearFilters, loadRooms])
  );

  return (
    <ScreenContainer>
      <SectionHeader
        title="Browse available rooms"
        subtitle="Latest rooms from all approved owners appear here automatically."
      />
      {filteredRooms.length === 0 ? (
        <EmptyState
          title="No available rooms"
          description="Rooms added by owners will appear here as soon as they are available."
          icon="business-outline"
        />
      ) : (
        filteredRooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            isFavourite={favouriteRoomIds.includes(room.id)}
            onPress={() => navigation.navigate("RoomDetail", { roomId: room.id })}
            onToggleFavourite={() => toggleFavourite(room.id)}
          />
        ))
      )}
    </ScreenContainer>
  );
}
