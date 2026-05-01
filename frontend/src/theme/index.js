import { DefaultTheme } from "@react-navigation/native";
import { colors } from "./colors";
import { spacing } from "./spacing";
import { typography } from "./typography";

export { colors, spacing, typography };

export const appTheme = {
  colors,
  spacing,
  typography,
  radius: {
    sm: 10,
    md: 16,
    lg: 22,
    pill: 999,
  },
  shadow: {
    shadowColor: "#103447",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4,
  },
};

export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};
