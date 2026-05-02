import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import { ROLE_LABELS } from "../../constants/auth";
import { useRoleAuth } from "../../context/RoleAuthContext";
import { useToast } from "../../context/ToastContext";
import { sendRegistrationOtp, verifyRegistrationOtp } from "../../services/roleAuthService";
import { appTheme } from "../../theme";
import { validateRegisterForm } from "../../utils/authValidation";
import { validateEmail, validateName, validateRequired } from "../../utils/validation";

const NAME_INPUT_PATTERN = /^[A-Za-z\s]*$/;
export default function RegisterFormScreen({
  navigation,
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
    })
  );
  const [errors, setErrors] = useState({});
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

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
      setErrors((current) => ({ ...current, email: "", otp: "" }));
      setOtp("");
      setOtpSent(false);
      setOtpVerified(false);
      setOtpMessage("");
      setOtpError("");
    }
  }

  function handleOtpChange(value) {
    setOtp(value.replace(/\D/g, "").slice(0, 6));
    setOtpError("");
    setErrors((current) => ({ ...current, otp: "" }));
  }

  async function handleSendOtp() {
    const nextErrors = { ...errors };

    if (!validateRequired(form.name)) {
      nextErrors.name = "This field is required.";
    } else if (!validateName(form.name)) {
      nextErrors.name = "Enter a valid name using letters only.";
    } else {
      delete nextErrors.name;
    }

    if (!validateEmail(form.email)) {
      nextErrors.email = "Please enter a valid email.";
    } else {
      delete nextErrors.email;
    }

    setErrors(nextErrors);

    if (!validateRequired(form.name) || !validateName(form.name) || !validateEmail(form.email)) {
      return;
    }

    setSendingOtp(true);
    setOtpError("");

    try {
      await sendRegistrationOtp({
        name: form.name,
        email: form.email,
      });
      setOtp("");
      setOtpSent(true);
      setOtpVerified(false);
      setOtpMessage("OTP sent to your email. It expires in 5 minutes.");
      setErrors((current) => ({ ...current, otp: "" }));
      showToast("OTP sent successfully.", "success");
    } catch (error) {
      setOtpError(error.message || "Unable to send OTP right now.");
      setOtpMessage("");
      setErrors((current) => ({
        ...current,
        email: error.message || "Unable to send OTP right now.",
      }));
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otpSent) {
      setOtpError("Send the OTP first.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Enter the 6-digit OTP.");
      return;
    }

    setVerifyingOtp(true);
    setOtpError("");

    try {
      await verifyRegistrationOtp({
        email: form.email,
        otp,
      });
      setOtpVerified(true);
      setOtpMessage("Email verified successfully.");
      setErrors((current) => ({ ...current, otp: "" }));
      showToast("Email verified successfully.", "success");
    } catch (error) {
      setOtpVerified(false);
      setOtpError(error.message || "OTP verification failed.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleSubmit() {
    const nextErrors = validateRegisterForm(role, form);
    if (!otpVerified) {
      nextErrors.otp = "Verify your email OTP before registering.";
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload = {
      role,
      name: form.name,
      email: form.email,
      password: form.password,
      ...fields.reduce((accumulator, field) => {
        accumulator[field.name] = form[field.name];
        return accumulator;
      }, {}),
    };

    const result = await register(payload);
    if (!result.success) {
      Alert.alert("Registration Failed", result.message);
      return;
    }

    Alert.alert(
      "Registration Successful",
      `${ROLE_LABELS[role]} account created successfully. Please log in.`
    );
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

                    {field.name === "email" ? (
                      <View style={styles.otpCard}>
                        <View style={styles.otpHeader}>
                          <Text style={styles.otpTitle}>Email verification</Text>
                          <Text style={styles.otpSubtitle}>
                            Send a 6-digit OTP to verify your email before registration.
                          </Text>
                        </View>

                        <AppButton
                          title={sendingOtp ? "Sending OTP..." : otpSent ? "Resend OTP" : "Send OTP"}
                          onPress={handleSendOtp}
                          loading={sendingOtp}
                          disabled={verifyingOtp}
                        />

                        {otpMessage ? (
                          <Text style={[styles.otpStatusText, otpVerified ? styles.successText : styles.infoText]}>
                            {otpMessage}
                          </Text>
                        ) : null}

                        {otpSent && !otpVerified ? (
                          <>
                            <AppInput
                              label="Enter OTP"
                              value={otp}
                              onChangeText={handleOtpChange}
                              placeholder="Enter 6-digit OTP"
                              keyboardType="number-pad"
                              autoCapitalize="none"
                              error={otpError || errors.otp}
                            />
                            <AppButton
                              title={otpVerified ? "OTP Verified" : "Verify OTP"}
                              onPress={handleVerifyOtp}
                              loading={verifyingOtp}
                              disabled={otpVerified || sendingOtp}
                              variant={otpVerified ? "secondary" : "primary"}
                            />
                          </>
                        ) : null}
                      </View>
                    ) : null}
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
                    disabled={!otpVerified}
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
  actions: {
    marginTop: appTheme.spacing.xs,
    gap: appTheme.spacing.sm,
  },
  otpCard: {
    marginTop: appTheme.spacing.xs,
    padding: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: "#D5E5F3",
    borderRadius: appTheme.radius.lg,
    backgroundColor: "#F7FBFF",
    gap: appTheme.spacing.sm,
  },
  otpHeader: {
    gap: 4,
  },
  otpTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  otpSubtitle: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
  otpStatusText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  successText: {
    color: appTheme.colors.success,
  },
  infoText: {
    color: appTheme.colors.primary,
  },
});
