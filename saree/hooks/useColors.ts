import { useColorScheme } from "react-native";
import Colors from "@/constants/colors";

export function useColors() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  return {
    ...Colors,
    background: theme.background,
    foreground: theme.text,
    card: theme.card,
    border: theme.border,
    muted: theme.surfaceSecondary,
    mutedForeground: theme.textSecondary,
    textGray: theme.textSecondary,
    textLight: theme.textTertiary,
    destructive: Colors.error,
    primaryForeground: Colors.white,
    secondaryForeground: Colors.white,
    theme,
    isDark,
  };
}