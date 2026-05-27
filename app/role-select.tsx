import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { UserRole } from "@/context/AuthContext";

interface RoleOption {
  role: UserRole;
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

const ROLES: RoleOption[] = [
  { role: "customer", title: "عميل عادي", subtitle: "طلب توصيل الطرود", icon: "user", color: "#6C63FF" },
  { role: "store_owner", title: "صاحب متجر", subtitle: "إدارة الفروع والطلبات", icon: "shopping-bag", color: "#FF6584" },
  { role: "driver", title: "سائق", subtitle: "توصيل وكسب المال", icon: "navigation", color: "#28A745" },
  { role: "agent", title: "وكيل محلي", subtitle: "استلام المدفوعات", icon: "briefcase", color: "#9C27B0" },
  { role: "admin", title: "مدير النظام", subtitle: "إدارة المنصة", icon: "settings", color: "#1E88E5" },
  { role: "support", title: "دعم فني", subtitle: "مساعدة العملاء", icon: "headphones", color: "#00ACC1" },
];

export default function RoleSelectScreen() {
  const colors = useColors();
  const router = useRouter();

  const handleSelect = (role: UserRole) => {
    router.push({ pathname: "/login", params: { role } });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primaryContainer }]}>
            <Feather name="zap" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>مرحباً بك في سريع</Text>
          <Text style={[styles.subtitle, { color: colors.textGray }]}>
            منصة التوصيل السريع - اختر نوع حسابك
          </Text>
        </View>

        <View style={styles.grid}>
          {ROLES.map((item) => (
            <TouchableOpacity
              key={item.role}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSelect(item.role)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + "18" }]}>
                <Feather name={item.icon} size={26} color={item.color} />
              </View>
              <Text style={[styles.roleTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.roleSub, { color: colors.textGray }]}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.hint, { color: colors.textLight }]}>
          يمكنك تغيير نوع الحساب لاحقاً من الإعدادات
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 32, marginTop: 20 },
  logoContainer: {
    width: 80, height: 80, borderRadius: 24,
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 6, textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  card: {
    width: "47%", padding: 16, borderRadius: 16, borderWidth: 1,
    alignItems: "center", gap: 8,
  },
  iconBox: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
  },
  roleTitle: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  roleSub: { fontSize: 11, textAlign: "center", lineHeight: 16 },
  hint: { textAlign: "center", fontSize: 12, marginTop: 24 },
});
