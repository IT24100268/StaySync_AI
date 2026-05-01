import React, { useState } from "react";
import { Alert } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import RoomListingForm from "../../components/form/RoomListingForm";
import { useOwnerAuth } from "../../context/OwnerAuthContext";
import { useOwnerListings } from "../../context/OwnerListingsContext";
import { createEmptyRoomForm } from "../../utils/roomForm";
import { validateOwnerRoom } from "../../utils/validation";

export default function AddRoomScreen({ navigation }) {
  const { owner } = useOwnerAuth();
  const { addListing, submitting } = useOwnerListings();
  const [form, setForm] = useState(createEmptyRoomForm(owner?.id));
  const [errors, setErrors] = useState({});

  async function handleSubmit() {
    const nextErrors = validateOwnerRoom(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload = {
      ...form,
      ownerId: owner?.id,
      rent: Number(form.rent),
      deposit: Number(form.deposit),
      maxCapacity: Number(form.maxCapacity),
    };

    const result = await addListing(payload);
    if (!result.success) {
      Alert.alert("Create Failed", result.message);
      return;
    }

    Alert.alert("Listing Created", "Your room listing has been added successfully.");
    navigation.replace("OwnerRoomDetails", { listingId: result.listing.id });
  }

  return (
    <ScreenContainer>
      <RoomListingForm
        form={form}
        errors={errors}
        onChange={setForm}
        onSubmit={handleSubmit}
        submitLabel="Create Listing"
        loading={submitting}
      />
    </ScreenContainer>
  );
}
