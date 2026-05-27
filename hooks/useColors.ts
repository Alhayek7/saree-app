// hooks/useColors.ts
import { useColorScheme } from "react-native";
import colors from "@/constants/colors";

export function useColors() {
  const scheme = useColorScheme();
  // بما أن ملف colors لا يحتوي على dark mode، نستخدم light فقط
  const palette = colors.light;
  return palette;
}