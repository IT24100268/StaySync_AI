import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import { appTheme } from "../../theme";
import { requestPasswordReset, resetPassword } from "../../services/roleAuthService";

export default function ForgotPasswordScreen({ navigation }) {
  const [form, setForm] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    if (key === "otp" && verifyMessage) {
      setVerifyMessage("");
    }
    if (submitError) {
      setSubmitError("");
    }
    if (resetMessage) {
      setResetMessage("");
    }
  }

  function validateEmailOnly() {
    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    return nextErrors;
  }

  function validateResetForm() {
    const nextErrors = validateEmailOnly();

    if (!form.otp.trim()) {
      nextErrors.otp = "Reset code is required.";
    } else if (!/^\d{6}$/.test(form.otp.trim())) {
      nextErrors.otp = "Reset code must be 6 digits.";
    }

    if (!form.password) {
      nextErrors.password = "New password is required.";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    return nextErrors;
  }

  function validateOtpOnly() {
    const nextErrors = validateEmailOnly();

    if (!form.otp.trim()) {
      nextErrors.otp = "Reset code is required.";
    } else if (!/^\d{6}$/.test(form.otp.trim())) {
      nextErrors.otp = "Reset code must be 6 digits.";
    }

    return nextErrors;
  }

  async function handleSendCode() {
    const nextErrors = validateEmailOnly();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSendingCode(true);
    try {
      const response = await requestPasswordReset({ email: form.email.trim() });
      setCodeSent(true);
      setCodeVerified(false);
      setVerifyMessage("");
      setResetMessage("");
      setSubmitError("");
      setForm((current) => ({
        ...current,
        otp: "",
        password: "",
        confirmPassword: "",
      }));
      Alert.alert(
        "Reset Code Sent",
        response?.message || "If an account exists for this email, a reset code has been sent."
      );
    } catch (error) {
      Alert.alert("Request Failed", error.message || "Unable to send reset code.");
    } finally {
      setSendingCode(false);
    }
  }

  async function handleVerifyCode() {
    const nextErrors = validateOtpOnly();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setVerifyingCode(true);
    try {
      setCodeVerified(true);
      setSubmitError("");
      setVerifyMessage("Verify successful. You can now enter a new password.");
    } finally {
      setVerifyingCode(false);
    }
  }

  async function handleResetPassword() {
    if (!codeVerified) {
      setSubmitError("Please verify the reset code before changing your password.");
      return;
    }

    const nextErrors = validateResetForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setResettingPassword(true);
    try {
      const response = await resetPassword({
        email: form.email.trim(),
        otp: form.otp.trim(),
        password: form.password,
      });
      setSubmitError("");
      setResetMessage(response?.message || "Reset successful.");
      Alert.alert("Reset Successful", response?.message || "Reset successful.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      setResetMessage("");
      setSubmitError(error.message || "Unable to reset password.");
      Alert.alert("Reset Failed", error.message || "Unable to reset password.");
    } finally {
      setResettingPassword(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>Back to Login</Text>
          </Pressable>

          <View style={styles.card}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email, request a 6-digit reset code, then choose a new password.
            </Text>

            <AppInput
              label="Email"
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
              placeholder="Enter your email"
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon="mail-outline"
              error={errors.email}
            />

            <AppButton
              title={codeSent ? "Resend Code" : "Send Reset Code"}
              onPress={handleSendCode}
              loading={sendingCode}
              variant="secondary"
            />

            {codeSent ? (
              <>
                <AppInput
                  label="Reset Code"
                  value={form.otp}
                  onChangeText={(value) => {
                    updateField("otp", value);
                    if (codeVerified) {
                      setCodeVerified(false);
                    }
                  }}
                  placeholder="Enter 6-digit code"
                  keyboardType="number-pad"
                  leftIcon="key-outline"
                  error={errors.otp}
                />

                <AppButton
                  title="Verify"
                  onPress={handleVerifyCode}
                  loading={verifyingCode}
                  variant="secondary"
                />

                {verifyMessage ? <Text style={styles.successText}>{verifyMessage}</Text> : null}
              </>
            ) : null}

            {codeVerified ? (
              <>
                <AppInput
                  label="New Password"
                  value={form.password}
                  onChangeText={(value) => updateField("password", value)}
                  placeholder="Enter new password"
                  secureTextEntry
                  leftIcon="lock-closed-outline"
                  error={errors.password}
                />

                <AppInput
                  label="Confirm New Password"
                  value={form.confirmPassword}
                  onChangeText={(value) => updateField("confirmPassword", value)}
                  placeholder="Re-enter new password"
                  secureTextEntry
                  leftIcon="shield-checkmark-outline"
                  error={errors.confirmPassword}
                />

                <AppButton
                  title="Reset Password"
                  onPress={handleResetPassword}
                  loading={resettingPassword}
                />

                {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
                {resetMessage ? <Text style={styles.successText}>{resetMessage}</Text> : null}
              </>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    gap: 18,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  backText: {
    color: appTheme.colors.primary,
    fontWeight: "700",
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  title: {
    color: appTheme.colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    lineHeight: 22,
  },
  successText: {
    color: appTheme.colors.success,
    fontWeight: "700",
    lineHeight: 20,
  },
  errorText: {
    color: appTheme.colors.danger,
    fontWeight: "700",
    lineHeight: 20,
  },
});
