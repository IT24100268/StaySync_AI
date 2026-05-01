import React from "react";
import ScreenContainer from "../../components/common/ScreenContainer";
import EmptyState from "../../components/common/EmptyState";
import RoomCard from "../../components/room/RoomCard";
import { useRooms } from "../../context/RoomContext";

export default function FavouritesScreen({ navigation }) {
  const { rooms, favouriteRoomIds, toggleFavourite } = useRooms();
  const favourites = rooms.filter((room) => favouriteRoomIds.includes(room.id));

  return (
    <ScreenContainer>
      {favourites.length === 0 ? (
        <EmptyState
          title="No favourite rooms yet"
          description="Save rooms you like so you can revisit and compare them later."
          icon="heart-outline"
        />
      ) : (
        favourites.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            isFavourite
            onPress={() => navigation.navigate("RoomDetail", { roomId: room.id })}
            onToggleFavourite={() => toggleFavourite(room.id)}
          />
        ))
      )}
    </ScreenContainer>
  );
}
