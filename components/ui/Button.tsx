import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const colors = useColors();

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: colors.radius,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    };
    if (fullWidth) base.width = "100%" as any;

    const sizes = {
      sm: { paddingVertical: 8, paddingHorizontal: 16 },
      md: { paddingVertical: 14, paddingHorizontal: 20 },
      lg: { paddingVertical: 18, paddingHorizontal: 24 },
    };
    Object.assign(base, sizes[size]);

    switch (variant) {
      case "primary":
        return { ...base, backgroundColor: disabled ? colors.mutedForeground : colors.primary };
      case "secondary":
        return { ...base, backgroundColor: disabled ? colors.mutedForeground : colors.secondary };
      case "outline":
        return { ...base, backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.primary };
      case "ghost":
        return { ...base, backgroundColor: "transparent" };
      case "danger":
        return { ...base, backgroundColor: disabled ? colors.mutedForeground : colors.destructive };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "outline":
      case "ghost":
        return colors.primary;
      default:
        return "#FFFFFF";
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "sm": return 14;
      case "md": return 16;
      case "lg": return 18;
    }
  };

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color={getTextColor()} />}
      <Text
        style={[
          styles.text,
          { color: getTextColor(), fontSize: getFontSize() },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
});
