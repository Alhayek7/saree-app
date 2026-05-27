import React from "react";
import { StyleSheet, View, ViewProps, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface CardProps extends ViewProps {
  elevated?: boolean;
  style?: ViewStyle;
}

export function Card({ elevated = false, style, children, ...props }: CardProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          shadowColor: elevated ? "#000" : "transparent",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
});
