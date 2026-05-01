import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchRooms } from "../services/roomService";
import { useRoleAuth } from "./RoleAuthContext";

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const { user } = useRoleAuth();
  const [rooms, setRooms] = useState([]);
  const [favouriteRoomIds, setFavouriteRoomIds] = useState([]);
  const [filters, setFilters] = useState({
    query: "",
    location: "",
    maxPrice: "",
    genderAllowed: "",
    facilities: [],
    distance: "",
  });

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    setFavouriteRoomIds([]);
  }, [user?.id]);

  const loadRooms = useCallback(async () => {
    try {
      const response = await fetchRooms();
      setRooms(response);
    } catch (error) {
      setRooms([]);
    }
  }, []);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesQuery =
        !filters.query ||
        room.title.toLowerCase().includes(filters.query.toLowerCase()) ||
        room.location.toLowerCase().includes(filters.query.toLowerCase());
      const matchesLocation =
        !filters.location ||
        room.location.toLowerCase().includes(filters.location.toLowerCase());
      const matchesPrice = !filters.maxPrice || room.price <= Number(filters.maxPrice);
      const matchesGender =
        !filters.genderAllowed || room.genderAllowed === filters.genderAllowed;
      const matchesDistance = !filters.distance || room.distance <= Number(filters.distance);
      const matchesFacilities =
        filters.facilities.length === 0 ||
        filters.facilities.every((item) => room.facilities.includes(item));

      return (
        matchesQuery &&
        matchesLocation &&
        matchesPrice &&
        matchesGender &&
        matchesDistance &&
        matchesFacilities
      );
    });
  }, [filters, rooms]);

  const toggleFavourite = useCallback((roomId) => {
    setFavouriteRoomIds((current) =>
      current.includes(roomId)
        ? current.filter((id) => id !== roomId)
        : [...current, roomId]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      query: "",
      location: "",
      maxPrice: "",
      genderAllowed: "",
      facilities: [],
      distance: "",
    });
  }, []);

  const value = useMemo(
    () => ({
      rooms,
      setRooms,
      loadRooms,
      filteredRooms,
      filters,
      setFilters,
      clearFilters,
      favouriteRoomIds,
      toggleFavourite,
    }),
    [clearFilters, favouriteRoomIds, filteredRooms, filters, loadRooms, rooms, toggleFavourite]
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRooms() {
  const context = useContext(RoomContext);

  if (!context) {
    throw new Error("useRooms must be used within RoomProvider");
  }

  return context;
}
