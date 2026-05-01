import React, { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import ScreenContainer from "../../components/common/ScreenContainer";
import EmptyState from "../../components/common/EmptyState";
import RoomCard from "../../components/room/RoomCard";
import { useRooms } from "../../context/RoomContext";

export default function RoomListScreen({ navigation }) {
  const { filteredRooms, favouriteRoomIds, toggleFavourite, loadRooms } = useRooms();

  useFocusEffect(
    useCallback(() => {
      loadRooms();
    }, [loadRooms])
  );

  return (
    <ScreenContainer>
      {filteredRooms.length === 0 ? (
        <EmptyState
          title="No rooms matched"
          description="Try expanding your filters or clearing one of the selected criteria."
          icon="search-outline"
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
