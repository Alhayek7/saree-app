import { useAuth, UserRole } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useColors } from "@/hooks/useColors";

const ROLE_CONFIG: Record<UserRole, { title: string; icon: keyof typeof Feather.glyphMap; color: string; demo: { phone: string; password: string } }> = {
  customer:    { title: "عميل عادي", icon: "user", color: "#6C63FF", demo: { phone: "0591234567", password: "customer123" } },
  store_owner: { title: "صاحب متجر", icon: "shopping-bag", color: "#FF6584", demo: { phone: "0598887777", password: "store123" } },
  driver:      { title: "سائق", icon: "navigation", color: "#28A745", demo: { phone: "0597654321", password: "driver123" } },
  agent:       { title: "وكيل محلي", icon: "briefcase", color: "#9C27B0", demo: { phone: "0591112222", password: "agent123" } },
  admin:       { title: "مدير النظام", icon: "settings", color: "#1E88E5", demo: { phone: "0591000000", password: "admin123" } },
  support:     { title: "دعم فني", icon: "headphones", color: "#00ACC1", demo: { phone: "0594000000", password: "support123" } },
};

export default function LoginScreen() {
  const { role: roleParam } = useLocalSearchParams<{ role: string }>();
  const role = (roleParam as UserRole) || "customer";
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.customer;

  const colors = useColors();
  const router = useRouter();
  const { login, error, clearError } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; password?: string }>({});

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!phone || phone.length < 10) errs.phone = "أدخل رقم هاتف صحيح";
    if (!password || password.length < 4) errs.password = "أدخل كلمة المرور";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;
    setLoading(true);
    const ok = await login(phone, password, role);
    setLoading(false);
    if (ok) {
  // التوجيه حسب الدور
  if (role === "customer") router.replace("/(customer)");
  else if (role === "driver") router.replace("/(driver)");
  else if (role === "store_owner") router.replace("/(store-owner)");
  else if (role === "agent") router.replace("/(agent)");
  else if (role === "admin") router.replace("/(admin)");
    else if (role === "support") router.replace("/(support)");
  else router.replace("/");
}
console.log("Logged in as role:", role);
  };

  const fillDemo = () => {
    setPhone(config.demo.phone);
    setPassword(config.demo.password);
    setFieldErrors({});
    clearError();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-right" size={22} color={colors.foreground} />
          </TouchableOpacity>

          <View style={styles.iconWrapper}>
            <View style={[styles.iconBox, { backgroundColor: config.color + "18" }]}>
              <Feather name={config.icon} size={36} color={config.color} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              تسجيل الدخول
            </Text>
            <Text style={[styles.roleLabel, { color: config.color }]}>
              {config.title}
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="رقم الهاتف"
              leftIcon="phone"
              placeholder="05xxxxxxxx"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              error={fieldErrors.phone}
            />
            <Input
              label="كلمة المرور"
              leftIcon="lock"
              rightIcon={showPass ? "eye-off" : "eye"}
              onRightIconPress={() => setShowPass(!showPass)}
              placeholder="••••••••"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
              error={fieldErrors.password}
            />

            {error && (
              <View style={[styles.errorBox, { backgroundColor: "#FFEBEE" }]}>
                <Feather name="alert-circle" size={16} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            )}

            <Button
              title="تسجيل الدخول"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
            />

            <TouchableOpacity onPress={fillDemo} style={styles.demoBtn}>
              <Feather name="zap" size={14} color={colors.primary} />
              <Text style={[styles.demoText, { color: colors.primary }]}>
                استخدم حساب تجريبي
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textGray }]}>
              ليس لديك حساب؟{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push({ pathname: "/register", params: { role } })}>
              <Text style={[styles.linkText, { color: colors.primary }]}>إنشاء حساب</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 24, paddingTop: 16 },
  backBtn: { alignSelf: "flex-start", padding: 4, marginBottom: 24 },
  iconWrapper: { alignItems: "center", marginBottom: 32 },
  iconBox: { width: 72, height: 72, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700" },
  roleLabel: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  form: { gap: 16 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10 },
  errorText: { flex: 1, fontSize: 13 },
  demoBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8 },
  demoText: { fontSize: 13, fontWeight: "500" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  footerText: { fontSize: 14 },
  linkText: { fontSize: 14, fontWeight: "700" },
});
