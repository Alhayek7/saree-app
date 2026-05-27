import { useAuth, UserRole } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
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

const VEHICLE_TYPES = [
  { key: "car", label: "سيارة 🚗" },
  { key: "bike", label: "باسكليت 🚲" },
  { key: "truck", label: "سيارة نقل 🚛" },
] as const;

const apiDomain = process.env.EXPO_PUBLIC_DOMAIN;

async function registerDriverApi(data: {
  fullName: string;
  phone: string;
  idNumber: string;
  vehicleType: string;
}): Promise<{ id: number } | null> {
  if (!apiDomain) return null;
  try {
    const res = await fetch(`https://${apiDomain}/api/drivers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default function RegisterScreen() {
  const { role: roleParam } = useLocalSearchParams<{ role: string }>();
  const role = (roleParam as UserRole) || "customer";
  const colors = useColors();
  const router = useRouter();
  const { register, error, clearError } = useAuth();
  const { setDriverApiId } = useDriver();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [agentCode, setAgentCode] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<"car" | "bike" | "truck">("car");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isDriver = role === "driver";

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName || fullName.length < 3) errs.fullName = "أدخل الاسم الكامل";
    if (!phone || phone.length < 10) errs.phone = "أدخل رقم هاتف صحيح";
    if (!password || password.length < 6) errs.password = "كلمة المرور 6 أحرف على الأقل";
    if (isDriver && !idNumber) errs.idNumber = "أدخل رقم الهوية";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) return;
    setLoading(true);

    if (isDriver) {
      const apiResult = await registerDriverApi({ fullName, phone, idNumber, vehicleType });
      if (apiResult) {
        await setDriverApiId(apiResult.id);
      }
    }

    const ok = await register({
      fullName,
      phone,
      password,
      role,
      neighborhood,
      agentCode,
      idNumber: isDriver ? idNumber : undefined,
      vehicleType: isDriver ? vehicleType : undefined,
    });
    setLoading(false);
    if (ok) {
      if (isDriver) {
        router.replace("/pending-approval");
      } else {
        router.replace("/");
      }
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-right" size={22} color={colors.foreground} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.foreground }]}>إنشاء حساب جديد</Text>
          <Text style={[styles.subtitle, { color: colors.textGray }]}>
            {isDriver ? "سجّل كسائق وابدأ العمل بعد الموافقة" : "أنشئ حسابك وابدأ الاستخدام فوراً"}
          </Text>

          <View style={styles.form}>
            <Input label="الاسم الكامل" leftIcon="user" placeholder="محمد أحمد" value={fullName} onChangeText={setFullName} error={fieldErrors.fullName} />
            <Input label="رقم الهاتف" leftIcon="phone" placeholder="05xxxxxxxx" keyboardType="phone-pad" value={phone} onChangeText={setPhone} error={fieldErrors.phone} />
            <Input label="كلمة المرور" leftIcon="lock" rightIcon={showPass ? "eye-off" : "eye"} onRightIconPress={() => setShowPass(!showPass)} placeholder="••••••••" secureTextEntry={!showPass} value={password} onChangeText={setPassword} error={fieldErrors.password} />
            <Input label="الحي / المنطقة" leftIcon="map-pin" placeholder="مثال: الرمال" value={neighborhood} onChangeText={setNeighborhood} />

            {isDriver && (
              <>
                <Input
                  label="رقم الهوية"
                  leftIcon="credit-card"
                  placeholder="123456789"
                  keyboardType="number-pad"
                  value={idNumber}
                  onChangeText={setIdNumber}
                  error={fieldErrors.idNumber}
                />
                <View>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>نوع المركبة</Text>
                  <View style={styles.vehicleRow}>
                    {VEHICLE_TYPES.map((v) => (
                      <TouchableOpacity
                        key={v.key}
                        style={[
                          styles.vehicleBtn,
                          {
                            backgroundColor: vehicleType === v.key ? "#28A745" : colors.card,
                            borderColor: vehicleType === v.key ? "#28A745" : colors.border,
                          },
                        ]}
                        onPress={() => setVehicleType(v.key)}
                      >
                        <Text style={[styles.vehicleBtnText, { color: vehicleType === v.key ? "#fff" : colors.foreground }]}>
                          {v.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {role === "agent" && (
              <Input label="كود الوكيل (اختياري)" leftIcon="key" placeholder="AGT001" value={agentCode} onChangeText={setAgentCode} />
            )}

            {error && (
              <View style={[styles.errorBox, { backgroundColor: "#FFEBEE" }]}>
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            )}

            <Button title="إنشاء الحساب" onPress={handleRegister} loading={loading} fullWidth size="lg" />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textGray }]}>لديك حساب بالفعل؟ </Text>
            <TouchableOpacity onPress={() => router.replace({ pathname: "/login", params: { role } })}>
              <Text style={[styles.linkText, { color: colors.primary }]}>تسجيل الدخول</Text>
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
  backBtn: { alignSelf: "flex-start", padding: 4, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 28 },
  form: { gap: 16 },
  fieldLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  vehicleRow: { flexDirection: "row", gap: 8 },
  vehicleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: "center" },
  vehicleBtnText: { fontSize: 13, fontWeight: "600" },
  errorBox: { padding: 12, borderRadius: 10 },
  errorText: { fontSize: 13 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  footerText: { fontSize: 14 },
  linkText: { fontSize: 14, fontWeight: "700" },
});
