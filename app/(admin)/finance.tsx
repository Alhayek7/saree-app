// app/(admin)/finance.tsx
import { Feather } from "@expo/vector-icons";
import React, { useState, useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGetAdminStats, getListDriversQueryOptions } from "@workspace/api-client-react";
import type { DriverProfile } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";

const ADMIN_COLOR = "#1E88E5";
const ADMIN_DARK = "#0D47A1";

// ==================== بطاقة الإحصائيات ====================

function SummaryCard({ icon, label, value, color, subtitle }: { icon: string; label: string; value: string; color: string; subtitle?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={22} color={color} />
      </View>
      <Text style={[styles.summaryVal, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.textGray }]}>{label}</Text>
      {subtitle && <Text style={[styles.summarySub, { color: colors.textLight }]}>{subtitle}</Text>}
    </View>
  );
}

// ==================== بطاقة السائق ====================

function DriverCard({ driver, colors }: { driver: DriverProfile; colors: any }) {
  if (!driver) return null;
  
  const isLow = (driver.commissionBalance ?? 0) < 5;
  const commissionsUsed = Math.max(0, 20 - (driver.commissionBalance ?? 0));
  
  const getVehicleIcon = () => {
    if (driver.vehicleType === "car") return "truck";
    if (driver.vehicleType === "bike") return "zap";
    return "truck";
  };
  
  return (
    <View style={[styles.driverCard, { backgroundColor: colors.card, borderColor: isLow ? "#FFC107" : colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: "#28A74520" }]}>
        <Text style={[styles.avatarText, { color: "#28A745" }]}>{driver.fullName?.charAt(0) || "س"}</Text>
      </View>
      <View style={styles.driverInfo}>
        <Text style={[styles.driverName, { color: colors.foreground }]}>{driver.fullName}</Text>
        <View style={styles.driverStats}>
          <View style={styles.vehicleBadge}>
            <Feather name={getVehicleIcon()} size={10} color={colors.textGray} />
            <Text style={[styles.driverSub, { color: colors.textGray }]}>
              {driver.vehicleType === "car" ? "سيارة" : driver.vehicleType === "bike" ? "بسكليت" : "نقل"}
            </Text>
          </View>
          <Text style={[styles.driverSub, { color: colors.textGray }]}>📦 {driver.totalDeliveries ?? 0} توصيلة</Text>
        </View>
        <Text style={[styles.commissionUsed, { color: colors.textLight }]}>عمولات محصّلة: {commissionsUsed} ₪</Text>
      </View>
      <View style={styles.balanceContainer}>
        <Text style={[styles.balanceValue, { color: isLow ? "#FFC107" : "#28A745" }]}>
          {driver.commissionBalance ?? 0} ₪
        </Text>
        <Text style={[styles.balanceLabel, { color: colors.textGray }]}>الرصيد الحالي</Text>
        {isLow && (
          <View style={[styles.lowBadge, { backgroundColor: "#FFF8E1" }]}>
            <Feather name="alert-triangle" size={10} color="#FFC107" />
            <Text style={styles.lowBadgeText}>رصيد منخفض</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ==================== المكون الرئيسي ====================

export default function AdminFinanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useGetAdminStats();
  const { data: drivers, isLoading: loadingDrivers, refetch: refetchDrivers } = useQuery(getListDriversQueryOptions() as any);
  
  // ✅ التحقق من أن driverList مصفوفة
  const driverList: DriverProfile[] = Array.isArray(drivers) ? drivers : [];
  
  // ✅ حساب الإحصائيات بأمان
  const totalDriverBalance = useMemo(() => {
    if (!Array.isArray(driverList) || driverList.length === 0) return 0;
    return driverList.reduce((sum, d) => sum + (d.commissionBalance ?? 0), 0);
  }, [driverList]);
  
  const totalCommissions = useMemo(() => {
    if (!Array.isArray(driverList) || driverList.length === 0) return 0;
    return driverList.reduce((sum, d) => sum + (20 - (d.commissionBalance ?? 0)), 0);
  }, [driverList]);
  
  const sortedByDeliveries = useMemo(() => {
    if (!Array.isArray(driverList)) return [];
    return [...driverList].sort((a, b) => (b.totalDeliveries ?? 0) - (a.totalDeliveries ?? 0));
  }, [driverList]);
  
  const isLoading = loadingStats || loadingDrivers;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchDrivers()]);
    setRefreshing(false);
  }, [refetchStats, refetchDrivers]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: ADMIN_COLOR, paddingTop: topPad + 16 }]}>
        <Text style={styles.headerTitle}>المالية</Text>
        <Text style={styles.headerSub}>ملخص الأرباح والعمولات</Text>
      </View>

      <FlatList
        data={sortedByDeliveries}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ADMIN_COLOR]} />}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            {isLoading ? (
              <ActivityIndicator color={ADMIN_COLOR} style={styles.loader} />
            ) : (
              <>
                {/* بطاقات الإحصائيات */}
                <View style={styles.summaryGrid}>
                  <SummaryCard
                    icon="trending-up"
                    label="إجمالي الأرباح"
                    value={`${stats?.totalRevenue ?? 0} ₪`}
                    color="#28A745"
                    subtitle="منذ إنشاء المنصة"
                  />
                  <SummaryCard
                    icon="percent"
                    label="العمولات المحصّلة"
                    value={`${stats?.totalCommissions ?? 0} ₪`}
                    color={ADMIN_COLOR}
                    subtitle="عمولة المنصة"
                  />
                  <SummaryCard
                    icon="users"
                    label="السائقون النشطون"
                    value={String(stats?.activeDrivers ?? 0)}
                    color="#4CAF50"
                  />
                  <SummaryCard
                    icon="clock"
                    label="بانتظار الموافقة"
                    value={String(stats?.pendingDrivers ?? 0)}
                    color="#FFA63D"
                  />
                  <SummaryCard
                    icon="credit-card"
                    label="أرصدة السائقين"
                    value={`${totalDriverBalance} ₪`}
                    color="#9C27B0"
                    subtitle="إجمالي الأرصدة"
                  />
                  <SummaryCard
                    icon="package"
                    label="إجمالي الطلبات"
                    value={String(stats?.totalOrders ?? 0)}
                    color="#FF6584"
                  />
                </View>

                {/* ملخص العمولات */}
                <View style={[styles.commissionSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.commissionItem}>
                    <Text style={[styles.commissionLabel, { color: colors.textGray }]}>إجمالي العمولات المدفوعة</Text>
                    <Text style={[styles.commissionValue, { color: "#28A745" }]}>{totalCommissions} ₪</Text>
                  </View>
                  <View style={styles.commissionDivider} />
                  <View style={styles.commissionItem}>
                    <Text style={[styles.commissionLabel, { color: colors.textGray }]}>إجمالي السائقين</Text>
                    <Text style={[styles.commissionValue, { color: ADMIN_COLOR }]}>{driverList.length}</Text>
                  </View>
                </View>

                {/* عنوان القسم */}
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>💰 أرصدة السائقين</Text>
              </>
            )}
          </View>
        }
        ListFooterComponent={loadingDrivers ? <ActivityIndicator color={ADMIN_COLOR} style={styles.footerLoader} /> : null}
        ListEmptyComponent={
          !isLoading && driverList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="dollar-sign" size={48} color={colors.textLight} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد بيانات مالية</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textGray }]}>لا يوجد سائقين لعرض أرصدتهم</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <DriverCard driver={item} colors={colors} />}
      />
    </View>
  );
}

// ==================== الأنماط ====================

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Header
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 4 },
  
  // List
  listContainer: { padding: 16, gap: 12, paddingBottom: 40 },
  headerContent: { gap: 16, marginBottom: 8 },
  
  // Summary Grid
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  summaryCard: { width: "48%", borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  summaryVal: { fontSize: 20, fontWeight: "800" },
  summaryLabel: { fontSize: 12 },
  summarySub: { fontSize: 10, marginTop: 2 },
  
  // Commission Summary
  commissionSummary: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 14, justifyContent: "space-around" },
  commissionItem: { flex: 1, alignItems: "center", gap: 4 },
  commissionLabel: { fontSize: 12 },
  commissionValue: { fontSize: 18, fontWeight: "800" },
  commissionDivider: { width: 1, backgroundColor: "#E5E5E5" },
  
  // Section Title
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 8, marginBottom: 4 },
  
  // Driver Card
  driverCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 20, fontWeight: "700" },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: "700" },
  driverStats: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  vehicleBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  driverSub: { fontSize: 11 },
  commissionUsed: { fontSize: 10, marginTop: 2 },
  balanceContainer: { alignItems: "flex-end", gap: 2 },
  balanceValue: { fontSize: 18, fontWeight: "800" },
  balanceLabel: { fontSize: 10 },
  lowBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  lowBadgeText: { fontSize: 9, fontWeight: "600", color: "#FFA000" },
  
  // Empty State
  emptyContainer: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySubtitle: { fontSize: 12, textAlign: "center" },
  
  // Loaders
  loader: { marginTop: 40 },
  footerLoader: { marginTop: 16 },
});