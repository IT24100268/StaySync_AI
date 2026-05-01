import React, { useMemo, useState } from "react";
import { Alert } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import EmptyState from "../../../../components/common/EmptyState";
import RoomListingForm from "../../components/form/RoomListingForm";
import { useOwnerListings } from "../../context/OwnerListingsContext";
import { validateOwnerRoom } from "../../utils/validation";

export default function EditRoomScreen({ route, navigation }) {
  const { listingId } = route.params || {};
  const { listings, editListing, submitting } = useOwnerListings();
  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === listingId),
    [listingId, listings]
  );
  const [form, setForm] = useState(
    selectedListing || {
      id: "",
      title: "",
      description: "",
      rent: "",
      deposit: "",
      roomType: "",
      facilities: [],
      genderAllowed: "",
      maxCapacity: "",
      rules: "",
      address: "",
      images: [],
      status: "available",
    }
  );
  const [errors, setErrors] = useState({});

  if (!selectedListing) {
    return (
      <ScreenContainer>
        <EmptyState title="Listing unavailable" description="The selected room listing could not be found." />
      </ScreenContainer>
    );
  }

  async function handleSubmit() {
    const nextErrors = validateOwnerRoom(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const result = await editListing({
      ...form,
      rent: Number(form.rent),
      deposit: Number(form.deposit),
      maxCapacity: Number(form.maxCapacity),
    });

    if (!result.success) {
      Alert.alert("Update Failed", result.message);
      return;
    }

    Alert.alert("Listing Updated", "Your room listing changes have been saved.");
    navigation.replace("OwnerRoomDetails", { listingId: result.listing.id });
  }

  return (
    <ScreenContainer>
      <RoomListingForm
        form={form}
        errors={errors}
        onChange={setForm}
        onSubmit={handleSubmit}
        submitLabel="Save Listing Changes"
        loading={submitting}
      />
    </ScreenContainer>
  );
}
