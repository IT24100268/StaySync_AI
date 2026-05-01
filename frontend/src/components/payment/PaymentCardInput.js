import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { appTheme } from "../../theme";

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  maxLength,
  error,
  secureTextEntry = false,
  containerStyle,
}) {
  return (
    <View style={[styles.fieldWrap, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8BA1AF"
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export default function PaymentCardInput({ values, errors, onChange }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Card details</Text>
      <InputField
        label="Card holder name"
        value={values.cardHolderName}
        onChangeText={(value) => onChange("cardHolderName", value)}
        placeholder="Aarav Sharma"
        error={errors.cardHolderName}
      />
      <InputField
        label="Card number"
        value={values.cardNumber}
        onChangeText={(value) => onChange("cardNumber", value)}
        placeholder="1234 5678 9012 3456"
        keyboardType="number-pad"
        maxLength={19}
        error={errors.cardNumber}
      />
      <View style={styles.row}>
        <InputField
          label="Expiry date"
          value={values.expiryDate}
          onChangeText={(value) => onChange("expiryDate", value)}
          placeholder="MM/YY"
          keyboardType="number-pad"
          maxLength={5}
          error={errors.expiryDate}
          containerStyle={styles.halfField}
        />
        <InputField
          label="CVV"
          value={values.cvv}
          onChangeText={(value) => onChange("cvv", value)}
          placeholder="123"
          keyboardType="number-pad"
          maxLength={4}
          error={errors.cvv}
          secureTextEntry
          containerStyle={styles.halfField}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: "#E3EBF2",
    ...appTheme.shadow,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  fieldWrap: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  input: {
    minHeight: 52,
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: "#D7E4EC",
    backgroundColor: "#FCFDFE",
    paddingHorizontal: appTheme.spacing.md,
    fontSize: 15,
    color: appTheme.colors.text,
  },
  inputError: {
    borderColor: appTheme.colors.danger,
  },
  error: {
    fontSize: 12,
    color: appTheme.colors.danger,
  },
  row: {
    flexDirection: "row",
    gap: appTheme.spacing.md,
  },
  halfField: {
    flex: 1,
  },
});
