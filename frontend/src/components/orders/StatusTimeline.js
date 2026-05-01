import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ORDER_STATUSES } from "../../utils/constants";
import { appTheme } from "../../theme";

export default function StatusTimeline({ currentStatus, statuses = ORDER_STATUSES }) {
  const currentIndex = statuses.findIndex((status) => status === currentStatus);

  return (
    <View style={styles.container}>
      {statuses.map((status, index) => {
        const active = index <= currentIndex;
        return (
          <View key={status} style={styles.item}>
            <View style={styles.row}>
              <View style={[styles.dot, active && styles.activeDot]} />
              <Text style={[styles.label, active && styles.activeLabel]}>{status}</Text>
            </View>
            {index < statuses.length - 1 ? (
              <View style={[styles.line, active && styles.activeLine]} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    ...appTheme.shadow,
  },
  item: {
    marginBottom: appTheme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: appTheme.spacing.sm,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: appTheme.colors.border,
  },
  activeDot: {
    backgroundColor: appTheme.colors.primary,
  },
  label: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
  },
  activeLabel: {
    color: appTheme.colors.text,
    fontWeight: "700",
  },
  line: {
    width: 2,
    height: 26,
    marginLeft: 6,
    marginTop: 6,
    backgroundColor: appTheme.colors.border,
  },
  activeLine: {
    backgroundColor: appTheme.colors.primary,
  },
});
