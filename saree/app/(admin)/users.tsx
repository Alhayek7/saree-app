import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  getListDriversQueryOptions,
  getListDriversQueryKey,
  getListOrdersQueryOptions,
  getListOrdersQueryKey,
  getListAgentsQueryKey,
  getListAgentsQueryOptions,
  useUpdateDriverStatus,
  useDeleteDriver,
  useDeleteAgent,
} from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { DriverProfile, AgentRecord, OrderRecord } from "@workspace/api-client-react";

const ADMIN_COLOR = "#1E88E5";
const DRIVER_COLOR = "#28A745";
const AGENT_COLOR = "#9C27B0";
const CUSTOMER_COLOR = "#6C63FF";

const STATUS_COLORS: Record<string, string> = {
  pending: "#FFC107",
  active: "#28A745",
  rejected: "#DC3545",
  suspended: "#6C757D",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "قيد المراجعة",
  active: "نشط",
  rejected: "مرفوض",
  suspended: "موقوف",
};
const VEHICLE_LABEL: Record<string, string> = {
  car: "🚗 سيارة",
  bike: "🚲 باسكليت",
  truck: "🚛 نقل",
};

type Tab = "customers" | "drivers" | "agents";

export default function AdminUsersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("drivers");
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const queryClient = useQueryClient();

  const { data: drivers, isLoading: loadingDrivers } = useQuery(getListDriversQueryOptions() as any);
  const { data: orders, isLoading: loadingOrders } = useQuery(getListOrdersQueryOptions() as any);
  const { data: agents, isLoading: loadingAgents } = useQuery(getListAgentsQueryOptions() as any);

  const updateStatus = useUpdateDriverStatus({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() }),
    },
  });

  const deleteDriver = useDeleteDriver({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() }),
    },
  });

  const deleteAgent = useDeleteAgent({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAgentsQueryKey() }),
    },
  });

  const driverList: DriverProfile[] = (drivers as DriverProfile[]) ?? [];
  const orderList: OrderRecord[] = (orders as OrderRecord[]) ?? [];
  const agentList: AgentRecord[] = (agents as AgentRecord[]) ?? [];

  const pendingCount = driverList.filter((d) => d.status === "pending").length;

  const uniqueCustomers = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orderList) {
      map.set(o.customerId, (map.get(o.customerId) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([id, count]) => ({ id, orderCount: count }));
  }, [orderList]);

  const handleDriverAction = (driverId: number, driverName: string, action: "active" | "rejected" | "suspended") => {
    const label = action === "active" ? "تفعيل" : action === "rejected" ? "رفض" : "تعليق";
    Alert.alert(
      `${label} السائق`,
      `هل تريد ${label} ${driverName}؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: label,
          style: action === "active" ? "default" : "destructive",
          onPress: () => updateStatus.mutate({ id: driverId, data: { status: action } }),
        },
      ]
    );
  };

  const handleDeleteDriver = (driverId: number, driverName: string) => {
    Alert.alert("حذف السائق", `هل تريد حذف ${driverName} نهائياً؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => deleteDriver.mutate({ id: driverId }) },
    ]);
  };

  const handleDeleteAgent = (agentId: number, agentName: string) => {
    Alert.alert("حذف الوكيل", `هل تريد حذف ${agentName} نهائياً؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => deleteAgent.mutate({ id: agentId }) },
    ]);
  };

  const isLoading = tab === "drivers" ? loadingDrivers : tab === "agents" ? loadingAgents : loadingOrders;

  const tabs: { key: Tab; label: string }[] = [
    { key: "drivers", label: `السائقون${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
    { key: "customers", label: "الزبائن" },
    { key: "agents", label: "الوكلاء" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: ADMIN_COLOR, paddingTop: topPad + 16 }]}>
        <Text style={styles.title}>إدارة المستخدمين</Text>
        <Text style={styles.subtitle}>
          {tab === "drivers"
            ? `${driverList.length} سائق${pendingCount > 0 ? ` · ${pendingCount} بانتظار الموافقة` : ""}`
            : tab === "customers"
            ? `${uniqueCustomers.length} زبون فريد`
            : `${agentList.length} وكيل`}
        </Text>
        <View style={styles.tabRow}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabChip, { backgroundColor: tab === t.key ? "rgba(255,255,255,0.25)" : "transparent", borderColor: tab === t.key ? "#fff" : "rgba(255,255,255,0.4)" }]}
              onPress={() => setTab(t.key)}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: tab === t.key ? "700" : "500" }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={ADMIN_COLOR} style={{ marginTop: 40 }} />
      ) : tab === "drivers" ? (
        <FlatList
          data={driverList}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: Platform.OS === "web" ? 34 : 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: item.status === "pending" ? "#FFC107" : colors.border }]}>
              {item.status === "pending" && (
                <View style={[styles.pendingBanner, { backgroundColor: "#FFF8E1" }]}>
                  <Feather name="clock" size={12} color="#FFC107" />
                  <Text style={{ color: "#FFA000", fontSize: 11, fontWeight: "700" }}>بانتظار الموافقة</Text>
                </View>
              )}
              <View style={styles.cardRow}>
                <View style={[styles.avatar, { backgroundColor: DRIVER_COLOR + "20" }]}>
                  <Text style={[styles.avatarText, { color: DRIVER_COLOR }]}>{item.fullName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.foreground }]}>{item.fullName}</Text>
                  <Text style={[styles.sub, { color: colors.textGray }]}>{item.phone}</Text>
                  <Text style={[styles.sub, { color: colors.textLight }]}>
                    {VEHICLE_LABEL[item.vehicleType] ?? item.vehicleType} · رصيد: {item.commissionBalance} ₪ · توصيلات: {item.totalDeliveries}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] ?? "#28A745") + "20" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] ?? "#28A745" }]}>
                    {STATUS_LABELS[item.status] ?? item.status}
                  </Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                {item.status === "pending" && (
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: "#E8F5E9", borderColor: "#28A745" }]}
                    onPress={() => handleDriverAction(item.id, item.fullName, "active")}
                  >
                    <Feather name="check" size={13} color="#28A745" />
                    <Text style={[styles.btnText, { color: "#28A745" }]}>تفعيل</Text>
                  </TouchableOpacity>
                )}
                {item.status === "active" && (
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: "#FFF8E1", borderColor: "#FFC107" }]}
                    onPress={() => handleDriverAction(item.id, item.fullName, "suspended")}
                  >
                    <Feather name="pause-circle" size={13} color="#FFC107" />
                    <Text style={[styles.btnText, { color: "#FFC107" }]}>تعليق</Text>
                  </TouchableOpacity>
                )}
                {(item.status === "suspended" || item.status === "rejected") && (
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: "#E8F5E9", borderColor: "#28A745" }]}
                    onPress={() => handleDriverAction(item.id, item.fullName, "active")}
                  >
                    <Feather name="check-circle" size={13} color="#28A745" />
                    <Text style={[styles.btnText, { color: "#28A745" }]}>إعادة تفعيل</Text>
                  </TouchableOpacity>
                )}
                {item.status === "pending" && (
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: "#FFEBEE", borderColor: "#DC3545" }]}
                    onPress={() => handleDriverAction(item.id, item.fullName, "rejected")}
                  >
                    <Feather name="x" size={13} color="#DC3545" />
                    <Text style={[styles.btnText, { color: "#DC3545" }]}>رفض</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: "#FFEBEE", borderColor: "#DC3545" }]}
                  onPress={() => handleDeleteDriver(item.id, item.fullName)}
                >
                  <Feather name="trash-2" size={13} color="#DC3545" />
                  <Text style={[styles.btnText, { color: "#DC3545" }]}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: colors.textGray, textAlign: "center", marginTop: 40 }}>لا يوجد سائقون</Text>}
        />
      ) : tab === "customers" ? (
        <FlatList
          data={uniqueCustomers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: Platform.OS === "web" ? 34 : 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardRow}>
                <View style={[styles.avatar, { backgroundColor: CUSTOMER_COLOR + "20" }]}>
                  <Feather name="user" size={20} color={CUSTOMER_COLOR} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.foreground }]}>زبون #{item.id.slice(-6)}</Text>
                  <Text style={[styles.sub, { color: colors.textGray }]}>معرف: {item.id}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: CUSTOMER_COLOR + "20" }]}>
                  <Text style={{ color: CUSTOMER_COLOR, fontSize: 12, fontWeight: "700" }}>{item.orderCount} طلب</Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: colors.textGray, textAlign: "center", marginTop: 40 }}>لا يوجد زبائن بعد</Text>}
        />
      ) : (
        <FlatList
          data={agentList}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: Platform.OS === "web" ? 34 : 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardRow}>
                <View style={[styles.avatar, { backgroundColor: AGENT_COLOR + "20" }]}>
                  <Text style={[styles.avatarText, { color: AGENT_COLOR }]}>{item.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.sub, { color: colors.textGray }]}>{item.phone}</Text>
                  <Text style={[styles.sub, { color: colors.textLight }]}>{item.address}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: (item.isActive ? "#28A745" : "#DC3545") + "20" }]}>
                  <Text style={{ color: item.isActive ? "#28A745" : "#DC3545", fontSize: 11, fontWeight: "700" }}>
                    {item.isActive ? "نشط" : "غير نشط"}
                  </Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: "#FFEBEE", borderColor: "#DC3545", flex: 0.5 }]}
                  onPress={() => handleDeleteAgent(item.id, item.name)}
                >
                  <Feather name="trash-2" size={13} color="#DC3545" />
                  <Text style={[styles.btnText, { color: "#DC3545" }]}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: colors.textGray, textAlign: "center", marginTop: 40 }}>لا يوجد وكلاء</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 16, gap: 6 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  tabRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  tabChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  pendingBanner: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, paddingHorizontal: 14 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, fontWeight: "700" },
  name: { fontSize: 14, fontWeight: "700" },
  sub: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: 8, padding: 12, paddingTop: 0 },
  btn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  btnText: { fontSize: 12, fontWeight: "700" },
});
