import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.card,
            borderColor: error
              ? colors.destructive
              : focused
              ? colors.primary
              : colors.border,
            borderRadius: colors.radius,
          },
          focused && styles.focused,
        ]}
      >
        {leftIcon && (
          <Feather
            name={leftIcon}
            size={18}
            color={focused ? colors.primary : colors.textGray}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.foreground,
              paddingLeft: leftIcon ? 0 : 14,
              paddingRight: rightIcon ? 0 : 14,
              textAlign: "right",
            },
            style,
          ]}
          placeholderTextColor={colors.textLight}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Feather
              name={rightIcon}
              size={18}
              color={focused ? colors.primary : colors.textGray}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    minHeight: 52,
  },
  focused: { shadowColor: "#6C63FF", shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  leftIcon: { paddingLeft: 14, paddingRight: 8 },
  rightIcon: { paddingRight: 14, paddingLeft: 8 },
  input: { flex: 1, fontSize: 15, paddingVertical: 14 },
  error: { fontSize: 12 },
});
