import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useGetAdminStats, useGetAdminAreaStats } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ADMIN_COLOR = "#1E88E5";

const STATUS_LABELS: Record<string, string> = {
  searching: "بحث",
  bidding: "عروض",
  accepted: "مقبول",
  heading_pickup: "للاستلام",
  picked: "في الطريق",
  delivering: "توصيل",
  delivered: "وصل",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const VEHICLE_LABEL: Record<string, string> = {
  car: "🚗 سيارة",
  bike: "🚲 باسكليت",
  truck: "🚛 نقل",
};

function BarChart({ data }: { data: { date: string; orders: number; revenue: number }[] }) {
  const colors = useColors();
  const maxOrders = Math.max(...data.map((d) => d.orders), 1);
  const BARS = "█▉▊▋▌▍▎▏";
  return (
    <View style={{ gap: 6 }}>
      {data.map((d) => {
        const ratio = d.orders / maxOrders;
        const barLen = Math.round(ratio * 12);
        const bar = "█".repeat(barLen) + "░".repeat(12 - barLen);
        const dayLabel = d.date.slice(5);
        return (
          <View key={d.date} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: colors.textGray, fontSize: 11, width: 36 }}>{dayLabel}</Text>
            <Text style={{ color: ADMIN_COLOR, fontSize: 13, fontFamily: "monospace", flex: 1 }}>{bar}</Text>
            <Text style={{ color: colors.foreground, fontSize: 12, width: 28, textAlign: "left" }}>{d.orders}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function AdminDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: stats, isLoading: loadingStats } = useGetAdminStats();
  const { data: areaStats, isLoading: loadingAreas } = useGetAdminAreaStats();

  const topDrivers = (stats?.topDrivers ?? []).slice(0, 3);
  const worstDrivers = [...(stats?.topDrivers ?? [])].reverse().slice(0, 3);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { backgroundColor: ADMIN_COLOR, paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>لوحة التحكم</Text>
            <Text style={styles.adminName}>{user?.fullName ?? "المدير"}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => { await logout(); router.replace("/role-select"); }}
          >
            <Feather name="log-out" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {loadingStats ? (
          <ActivityIndicator color="rgba(255,255,255,0.8)" style={{ marginTop: 16 }} />
        ) : (
          <View style={styles.statsRow}>
            {[
              { label: "إجمالي الطلبات", value: String(stats?.totalOrders ?? 0), icon: "package" as const },
              { label: "الزبائن", value: String(stats?.uniqueCustomers ?? 0), icon: "users" as const },
              { label: "السائقون", value: String(stats?.totalDrivers ?? 0), icon: "navigation" as const },
              { label: "الوكلاء", value: String(stats?.totalAgents ?? 0), icon: "briefcase" as const },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Feather name={s.icon} size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statVal}>{s.value}</Text>
                <Text style={styles.statLbl}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ padding: 16, gap: 20 }}>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الطلبات حسب الحالة</Text>
          {loadingStats ? <ActivityIndicator color={ADMIN_COLOR} /> : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(stats?.ordersByStatus ?? {}).map(([status, count]) => (
                <View key={status} style={[styles.statusChip, { backgroundColor: ADMIN_COLOR + "15" }]}>
                  <Text style={{ color: ADMIN_COLOR, fontSize: 12, fontWeight: "700" }}>{STATUS_LABELS[status] ?? status}</Text>
                  <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "800" }}>{count}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>آخر 7 أيام</Text>
          {loadingStats ? <ActivityIndicator color={ADMIN_COLOR} /> : (
            <BarChart data={stats?.dailyStats ?? []} />
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>أفضل السائقين أداءً</Text>
          {topDrivers.length === 0 ? (
            <Text style={{ color: colors.textGray, fontSize: 13 }}>لا توجد بيانات بعد</Text>
          ) : topDrivers.map((d, i) => (
            <View key={d.id} style={[styles.driverRow, { borderColor: colors.border }]}>
              <Text style={{ color: ADMIN_COLOR, fontSize: 18, fontWeight: "800", width: 28 }}>#{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700" }}>{d.fullName}</Text>
                <Text style={{ color: colors.textGray, fontSize: 11 }}>{VEHICLE_LABEL[d.vehicleType] ?? d.vehicleType}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: "#28A745", fontSize: 15, fontWeight: "800" }}>{d.totalDeliveries}</Text>
                <Text style={{ color: colors.textGray, fontSize: 10 }}>توصيلة</Text>
              </View>
            </View>
          ))}
        </View>

        {worstDrivers.length > 0 && worstDrivers[0]?.id !== topDrivers[0]?.id && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>أقل السائقين نشاطاً</Text>
            {worstDrivers.map((d) => (
              <View key={d.id} style={[styles.driverRow, { borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700" }}>{d.fullName}</Text>
                  <Text style={{ color: colors.textGray, fontSize: 11 }}>{VEHICLE_LABEL[d.vehicleType] ?? d.vehicleType}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: "#DC3545", fontSize: 15, fontWeight: "800" }}>{d.totalDeliveries}</Text>
                  <Text style={{ color: colors.textGray, fontSize: 10 }}>توصيلة</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>أكثر المناطق نشاطاً</Text>
          {loadingAreas ? <ActivityIndicator color={ADMIN_COLOR} /> : (
            (areaStats ?? []).slice(0, 8).map((area, i) => (
              <View key={area.area} style={[styles.areaRow, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textGray, fontSize: 12, width: 20 }}>{i + 1}.</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>{area.area}</Text>
                  <Text style={{ color: colors.textGray, fontSize: 11 }}>
                    🚗 {area.byVehicle.car ?? 0}  🚲 {area.byVehicle.bike ?? 0}  🚛 {area.byVehicle.truck ?? 0}
                  </Text>
                </View>
                <View style={[styles.countBadge, { backgroundColor: ADMIN_COLOR + "15" }]}>
                  <Text style={{ color: ADMIN_COLOR, fontSize: 14, fontWeight: "800" }}>{area.totalDeliveries}</Text>
                </View>
              </View>
            ))
          )}
          {!loadingAreas && (areaStats ?? []).length === 0 && (
            <Text style={{ color: colors.textGray, fontSize: 13 }}>لا توجد بيانات بعد</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  greeting: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  adminName: { color: "#fff", fontSize: 20, fontWeight: "700" },
  logoutBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statCard: { flex: 1, minWidth: "22%", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 12, padding: 10, alignItems: "center", gap: 4 },
  statVal: { color: "#fff", fontSize: 16, fontWeight: "800" },
  statLbl: { color: "rgba(255,255,255,0.75)", fontSize: 9, textAlign: "center" },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  statusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignItems: "center", gap: 2 },
  driverRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1 },
  areaRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, borderBottomWidth: 1 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
});
