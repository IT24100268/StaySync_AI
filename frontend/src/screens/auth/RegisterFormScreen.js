import React, { useEffect, useState } from "react";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import { ROLE_LABELS } from "../../constants/auth";
import { useRoleAuth } from "../../context/RoleAuthContext";
import { useToast } from "../../context/ToastContext";
import { appTheme } from "../../theme";
import { validateRegisterForm } from "../../utils/authValidation";
import { blurActiveElement } from "../../utils/webFocus";

const NAME_INPUT_PATTERN = /^[A-Za-z\s]*$/;
export default function RegisterFormScreen({
  navigation,
  route,
  role,
  title,
  description,
  fields,
}) {
  const { register, authenticating } = useRoleAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(
    fields.reduce((accumulator, field) => ({ ...accumulator, [field.name]: "" }), {
      password: "",
      confirmPassword: "",
      role,
      latitude: null,
      longitude: null,
      locationAddress: "",
    })
  );
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const selectedLocation = route?.params?.selectedLocation;

    if (!selectedLocation) {
      return;
    }

    setForm((current) => ({
      ...current,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      locationAddress: selectedLocation.address || current.locationAddress,
      address: current.address || selectedLocation.address || "",
    }));
    navigation.setParams({ selectedLocation: undefined });
  }, [navigation, route?.params?.selectedLocation]);

  function updateField(key, value) {
    if (key === "name") {
      if (!NAME_INPUT_PATTERN.test(value)) {
        setErrors((current) => ({
          ...current,
          name: "Please include letters only.",
        }));
        return;
      }

      setErrors((current) => ({
        ...current,
        name: "",
      }));
    }

    if (key === "phone") {
      const normalizedPhone = value.replace(/\D/g, "").slice(0, 15);

      setErrors((current) => ({
        ...current,
        phone: "",
      }));

      setForm((current) => ({ ...current, [key]: normalizedPhone }));
      return;
    }

    setForm((current) => ({ ...current, [key]: value }));

    if (key === "email") {
      setErrors((current) => ({ ...current, email: "" }));
    }
  }

  async function handleSubmit() {
    const nextErrors = validateRegisterForm(role, form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload = {
      role,
      name: form.name,
      email: form.email,
      password: form.password,
      latitude: form.latitude,
      longitude: form.longitude,
      locationAddress: form.locationAddress,
      ...fields.reduce((accumulator, field) => {
        if (field.type === "location") {
          return accumulator;
        }

        accumulator[field.name] = form[field.name];
        return accumulator;
      }, {}),
    };

    const result = await register(payload);
    if (!result.success) {
      blurActiveElement();

      if (Platform.OS === "web") {
        showToast(result.message || "Registration failed.", "error");
      } else {
        Alert.alert("Registration Failed", result.message);
      }
      return;
    }

    blurActiveElement();

    if (Platform.OS === "web") {
      showToast(`${ROLE_LABELS[role]} account created successfully. Please log in.`, "success");
    } else {
      Alert.alert(
        "Registration Successful",
        `${ROLE_LABELS[role]} account created successfully. Please log in.`
      );
    }
    navigation.navigate("Login");
  }

  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80",
      }}
      style={styles.root}
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.header}>
              <Text style={styles.eyebrow}>{ROLE_LABELS[role]}</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{description}</Text>
            </View>

            <LinearGradient
              colors={["rgba(255,255,255,0.96)", "rgba(240,246,255,0.92)"]}
              style={styles.card}
            >
              <View style={styles.form}>
                {fields.map((field) => (
                  <React.Fragment key={field.name}>
                    {field.type === "select" ? (
                      <AppSelect
                        label={field.label}
                        value={form[field.name]}
                        onChange={(value) => updateField(field.name, value)}
                        options={field.options || []}
                        placeholder={field.placeholder}
                        error={errors[field.name]}
                      />
                    ) : field.type === "location" ? (
                      <View style={styles.locationBlock}>
                        <Text style={styles.locationLabel}>{field.label}</Text>
                        <Pressable
                          style={styles.locationPicker}
                          onPress={() =>
                            navigation.navigate("LocationPicker", {
                              sourceRoute: "RestaurantRegister",
                              title: field.title || "Select Location",
                              initialLatitude: form.latitude,
                              initialLongitude: form.longitude,
                              initialAddress: form.locationAddress || form.address,
                            })
                          }
                        >
                          <View style={styles.locationIcon}>
                            <Ionicons name="location" size={18} color="#FFFFFF" />
                          </View>
                          <View style={styles.locationTextGroup}>
                            <Text style={styles.locationTitle}>
                              {form.latitude != null && form.longitude != null
                                ? "Restaurant location selected"
                                : field.title || "Select Restaurant Location"}
                            </Text>
                            <Text style={styles.locationText}>
                              {form.locationAddress ||
                                (form.latitude != null && form.longitude != null
                                  ? `${Number(form.latitude).toFixed(6)}, ${Number(
                                      form.longitude
                                    ).toFixed(6)}`
                                  : field.placeholder)}
                            </Text>
                          </View>
                        </Pressable>
                      </View>
                    ) : (
                      <AppInput
                        label={field.label}
                        value={form[field.name]}
                        onChangeText={(value) => updateField(field.name, value)}
                        placeholder={field.placeholder}
                        secureTextEntry={field.secureTextEntry}
                        multiline={field.multiline}
                        keyboardType={field.keyboardType}
                        autoCapitalize={field.autoCapitalize || "sentences"}
                        error={errors[field.name]}
                      />
                    )}
                  </React.Fragment>
                ))}

                <AppInput
                  label="Password"
                  value={form.password}
                  onChangeText={(value) => updateField("password", value)}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                  error={errors.password}
                />
                <AppInput
                  label="Confirm Password"
                  value={form.confirmPassword}
                  onChangeText={(value) => updateField("confirmPassword", value)}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                  error={errors.confirmPassword}
                />

                <View style={styles.actions}>
                  <AppButton
                    title="Register"
                    onPress={handleSubmit}
                    loading={authenticating}
                  />
                  <AppButton
                    title="Back to Login"
                    variant="secondary"
                    onPress={() => navigation.navigate("Login")}
                  />
                </View>
              </View>
            </LinearGradient>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17,24,39,0.45)",
  },
  header: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: appTheme.spacing.sm,
  },
  eyebrow: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    borderRadius: 24,
    padding: appTheme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    ...appTheme.shadow,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
    maxWidth: 340,
  },
  form: {
    gap: appTheme.spacing.sm,
  },
  locationBlock: {
    gap: appTheme.spacing.xs,
  },
  locationLabel: {
    color: appTheme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  locationPicker: {
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: appTheme.spacing.sm,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  locationTextGroup: {
    flex: 1,
    gap: 2,
  },
  locationTitle: {
    color: appTheme.colors.text,
    fontWeight: "700",
  },
  locationText: {
    color: appTheme.colors.textMuted,
    lineHeight: 19,
  },
  actions: {
    marginTop: appTheme.spacing.xs,
    gap: appTheme.spacing.sm,
  },
});
