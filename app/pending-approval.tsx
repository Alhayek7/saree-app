import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STEPS = [
  { icon: "file-text", label: "مراجعة البيانات", sub: "تأكد من صحة المعلومات المُدخلة" },
  { icon: "search", label: "مراجعة الطلب", sub: "الفريق يراجع طلب انضمامك" },
  { icon: "check-circle", label: "الموافقة والتفعيل", sub: "ستحصل على 20 شيكل رصيد ابتداءً" },
];

const apiDomain = process.env.EXPO_PUBLIC_DOMAIN;

async function fetchDriverStatus(driverApiId: number): Promise<string | null> {
  if (!apiDomain) return null;
  try {
    const res = await fetch(`https://${apiDomain}/api/drivers/${driverApiId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.status ?? null;
  } catch {
    return null;
  }
}

export default function PendingApprovalScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const { driverApiId, loadDriverApiId } = useDriver();
  const pulse = useRef(new Animated.Value(1)).current;
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadDriverApiId();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleLogout = async () => {
    await logout();
    router.replace("/role-select");
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    if (driverApiId) {
      const status = await fetchDriverStatus(driverApiId);
      if (status === "active") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (user) {
          await updateUser({ ...user, driverStatus: "active", commissionBalance: 20 });
        }
        router.replace("/(driver)/" as any);
        return;
      } else if (status === "rejected") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        alert("تم رفض طلبك. تواصل مع الدعم لمزيد من المعلومات.");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        alert("طلبك لا يزال قيد المراجعة. سنُخطرك عند الموافقة.");
      }
    } else {
      alert("طلبك لا يزال قيد المراجعة. سنُخطرك عند الموافقة.");
    }
    setChecking(false);
  };

  const handleDemoActivate = async () => {
    if (!user) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateUser({ ...user, driverStatus: "active", commissionBalance: 20 });
    router.replace("/(driver)/" as any);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: "#28A745", paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Feather name="log-out" size={18} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>سريع للتوصيل</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.body}>
        <Animated.View style={[styles.iconBox, { transform: [{ scale: pulse }] }]}>
          <View style={[styles.iconInner, { backgroundColor: "#FFF8E1" }]}>
            <Feather name="clock" size={48} color="#FFC107" />
          </View>
        </Animated.View>

        <Text style={[styles.title, { color: colors.foreground }]}>طلبك قيد المراجعة</Text>
        <Text style={[styles.sub, { color: colors.textGray }]}>
          شكراً {user?.fullName}! فريقنا يراجع بياناتك وسيتم تفعيل حسابك خلال ٢٤ ساعة.
        </Text>

        <View style={[styles.stepsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.stepsTitle, { color: colors.foreground }]}>خطوات التفعيل</Text>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepIcon, { backgroundColor: i === 0 ? "#28A74520" : colors.muted }]}>
                <Feather name={step.icon as any} size={16} color={i === 0 ? "#28A745" : colors.textLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepLabel, { color: i === 0 ? colors.foreground : colors.textGray }]}>{step.label}</Text>
                <Text style={[styles.stepSub, { color: colors.textLight }]}>{step.sub}</Text>
              </View>
              {i === 0 && (
                <View style={[styles.activeBadge, { backgroundColor: "#FFF8E1" }]}>
                  <Text style={{ color: "#FFC107", fontSize: 11, fontWeight: "700" }}>الآن</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={[styles.bonusCard, { backgroundColor: "#28A74512", borderColor: "#28A74540" }]}>
          <Text style={{ fontSize: 28 }}>🎁</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bonusTitle, { color: "#28A745" }]}>مكافأة التفعيل</Text>
            <Text style={[styles.bonusSub, { color: colors.textGray }]}>
              فور تفعيل حسابك ستحصل على ٢٠ شيكل رصيد مجاني لبدء العمل
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.checkBtn, { backgroundColor: "#28A745", opacity: checking ? 0.7 : 1 }]}
          onPress={handleCheckStatus}
          activeOpacity={0.85}
          disabled={checking}
        >
          <Feather name="refresh-cw" size={16} color="#fff" />
          <Text style={styles.checkBtnText}>{checking ? "جاري التحقق..." : "تحقق من حالة الطلب"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.demoBtn, { backgroundColor: "#6C63FF" }]}
          onPress={handleDemoActivate}
          activeOpacity={0.85}
        >
          <Feather name="zap" size={16} color="#fff" />
          <Text style={styles.demoBtnText}>تفعيل تجريبي (للعرض فقط)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.supportBtn, { borderColor: colors.border }]} activeOpacity={0.7}>
          <Feather name="headphones" size={16} color={colors.textGray} />
          <Text style={[styles.supportText, { color: colors.textGray }]}>التواصل مع الدعم</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  logoutBtn: { padding: 8 },
  body: { flex: 1, padding: 20, gap: 16, alignItems: "center" },
  iconBox: { marginTop: 20, marginBottom: 4 },
  iconInner: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  sub: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  stepsCard: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  stepsTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  stepLabel: { fontSize: 14, fontWeight: "600" },
  stepSub: { fontSize: 12, marginTop: 1 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  bonusCard: { width: "100%", flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  bonusTitle: { fontSize: 14, fontWeight: "700" },
  bonusSub: { fontSize: 12, marginTop: 2, lineHeight: 18 },
  checkBtn: { width: "100%", borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  checkBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  demoBtn: { width: "100%", borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  demoBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  supportBtn: { width: "100%", borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5 },
  supportText: { fontSize: 14, fontWeight: "600" },
});
