import React, { useEffect, useMemo, useState } from "react";
import ScreenContainer from "../../components/common/ScreenContainer";
import ComplaintForm from "../../components/reports/ComplaintForm";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { createReport } from "../../services/reportService";
import {
  FOOD_REPORT_TYPES,
  OTHER_REPORT_TYPES,
  REPORT_TYPES,
  ROOM_REPORT_TYPES,
} from "../../constants/reports";

function resolveTypes(mode, providedTypes) {
  if (Array.isArray(providedTypes) && providedTypes.length > 0) {
    return providedTypes;
  }

  if (mode === "room") {
    return ROOM_REPORT_TYPES;
  }

  if (mode === "food") {
    return FOOD_REPORT_TYPES;
  }

  if (mode === "other") {
    return OTHER_REPORT_TYPES;
  }

  return REPORT_TYPES;
}

export default function ComplaintFormScreen({ route, navigation }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const mode = route.params?.mode || "general";
  const types = useMemo(() => resolveTypes(mode, route.params?.availableTypes), [mode, route.params?.availableTypes]);
  const initialType = route.params?.initialType || types[0] || REPORT_TYPES[0];
  const [selectedType, setSelectedType] = useState(initialType);

  useEffect(() => {
    setSelectedType(initialType);
  }, [initialType]);

  async function handleSubmit() {
    const trimmedDescription = description.trim();

    if (!selectedType) {
      setError("Choose a complaint type before submitting.");
      return;
    }

    if (trimmedDescription.length < 10) {
      setError("Please add at least 10 characters so the support team can investigate.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await createReport({
        userId: user?.id,
        type: selectedType,
        targetId: route.params?.targetId || "",
        description: trimmedDescription,
      });

      showToast("Your report has been submitted.", "success");

      if (route.params?.returnTo === "complaints") {
        navigation.replace("StudentComplaints");
        return;
      }

      navigation.goBack();
    } catch (submitError) {
      setError(submitError.message || "We couldn't submit your report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <ComplaintForm
        title={route.params?.title || "Report an issue"}
        subtitle={
          route.params?.subtitle ||
          "Share the problem clearly and the StaySync team can review it faster."
        }
        types={types}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        description={description}
        onDescriptionChange={setDescription}
        onSubmit={handleSubmit}
        loading={submitting}
        error={error}
        submitLabel={route.params?.submitLabel || "Submit Report"}
      />
    </ScreenContainer>
  );
}
