import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGetAdminStats, getListDriversQueryOptions } from "@workspace/api-client-react";
import type { DriverProfile } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";

const ADMIN_COLOR = "#1E88E5";

function SummaryCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={22} color={color} />
      </View>
      <Text style={[styles.summaryVal, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.textGray }]}>{label}</Text>
    </View>
  );
}

export default function AdminFinanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: stats, isLoading: loadingStats } = useGetAdminStats();
  const { data: drivers, isLoading: loadingDrivers } = useQuery(getListDriversQueryOptions() as any);
  const driverList: DriverProfile[] = (drivers as DriverProfile[]) ?? [];

  const sortedByDeliveries = [...driverList].sort((a, b) => (b.totalDeliveries ?? 0) - (a.totalDeliveries ?? 0));

  const isLoading = loadingStats || loadingDrivers;

  const totalDriverBalance = driverList.reduce((sum, d) => sum + (d.commissionBalance ?? 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: ADMIN_COLOR, paddingTop: topPad + 16 }]}>
        <Text style={styles.title}>المالية</Text>
        <Text style={styles.subtitle}>ملخص الأرباح والعمولات</Text>
      </View>

      <FlatList
        data={sortedByDeliveries}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: Platform.OS === "web" ? 34 : 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 8 }}>
            {isLoading ? (
              <ActivityIndicator color={ADMIN_COLOR} style={{ marginTop: 20 }} />
            ) : (
              <>
                <View style={styles.summaryGrid}>
                  <SummaryCard
                    icon="trending-up"
                    label="إجمالي الأرباح"
                    value={`${stats?.totalRevenue ?? 0} ₪`}
                    color="#28A745"
                  />
                  <SummaryCard
                    icon="percent"
                    label="العمولات المحصّلة"
                    value={`${stats?.totalCommissions ?? 0} ₪`}
                    color={ADMIN_COLOR}
                  />
                  <SummaryCard
                    icon="users"
                    label="السائقون النشطون"
                    value={String(stats?.activeDrivers ?? 0)}
                    color="#28A745"
                  />
                  <SummaryCard
                    icon="clock"
                    label="بانتظار الموافقة"
                    value={String(stats?.pendingDrivers ?? 0)}
                    color="#FFC107"
                  />
                  <SummaryCard
                    icon="credit-card"
                    label="إجمالي أرصدة السائقين"
                    value={`${totalDriverBalance} ₪`}
                    color="#9C27B0"
                  />
                  <SummaryCard
                    icon="package"
                    label="إجمالي الطلبات"
                    value={String(stats?.totalOrders ?? 0)}
                    color="#FF6584"
                  />
                </View>

                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>أرصدة السائقين</Text>
              </>
            )}
          </View>
        }
        ListFooterComponent={loadingDrivers ? <ActivityIndicator color={ADMIN_COLOR} style={{ marginTop: 16 }} /> : null}
        ListEmptyComponent={
          !isLoading ? <Text style={{ color: colors.textGray, textAlign: "center", marginTop: 20 }}>لا يوجد سائقون</Text> : null
        }
        renderItem={({ item }) => {
          const commissionsUsed = Math.max(0, 20 - (item.commissionBalance ?? 0));
          const isLow = (item.commissionBalance ?? 0) < 5;
          return (
            <View style={[styles.driverCard, { backgroundColor: colors.card, borderColor: isLow ? "#FFC107" : colors.border }]}>
              <View style={[styles.avatar, { backgroundColor: "#28A74520" }]}>
                <Text style={[styles.avatarText, { color: "#28A745" }]}>{item.fullName.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.driverName, { color: colors.foreground }]}>{item.fullName}</Text>
                <Text style={[styles.driverSub, { color: colors.textGray }]}>
                  {item.vehicleType === "car" ? "🚗 سيارة" : item.vehicleType === "bike" ? "🚲 باسكليت" : "🚛 نقل"}
                  {" · "}{item.totalDeliveries} توصيلة
                </Text>
                <Text style={[styles.driverSub, { color: colors.textLight }]}>
                  عمولات محصّلة: {commissionsUsed} ₪
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={{ color: isLow ? "#FFC107" : "#28A745", fontSize: 18, fontWeight: "800" }}>
                  {item.commissionBalance} ₪
                </Text>
                <Text style={{ color: colors.textGray, fontSize: 11 }}>الرصيد الحالي</Text>
                {isLow && (
                  <View style={[styles.lowBadge, { backgroundColor: "#FFF8E1" }]}>
                    <Feather name="alert-triangle" size={10} color="#FFC107" />
                    <Text style={{ color: "#FFA000", fontSize: 10, fontWeight: "700" }}>رصيد منخفض</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 20 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  summaryCard: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  summaryVal: { fontSize: 20, fontWeight: "800" },
  summaryLabel: { fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  driverCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, fontWeight: "700" },
  driverName: { fontSize: 14, fontWeight: "700" },
  driverSub: { fontSize: 12, marginTop: 2 },
  lowBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
});
