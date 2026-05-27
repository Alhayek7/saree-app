import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useListOrders } from "@workspace/api-client-react";
import type { OrderRecord } from "@workspace/api-client-react";

const ADMIN_COLOR = "#1E88E5";

const STATUS_LABELS: Record<string, string> = {
  searching: "بحث عن سائق",
  bidding: "قيد التقديم",
  accepted: "مقبول",
  heading_pickup: "في الطريق للاستلام",
  picked: "تم الاستلام",
  delivering: "جاري التوصيل",
  delivered: "تم التوصيل",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  searching: { bg: "#FFF8E1", text: "#FFA000" },
  bidding: { bg: "#EDE7FF", text: "#6C63FF" },
  accepted: { bg: "#E3F2FD", text: "#1E88E5" },
  heading_pickup: { bg: "#E3F2FD", text: "#1E88E5" },
  picked: { bg: "#E8F5E9", text: "#28A745" },
  delivering: { bg: "#E8F5E9", text: "#28A745" },
  delivered: { bg: "#E8F5E9", text: "#28A745" },
  completed: { bg: "#E8F5E9", text: "#28A745" },
  cancelled: { bg: "#FFEBEE", text: "#DC3545" },
};

const FILTER_TABS = [
  { key: "all", label: "الكل" },
  { key: "searching,bidding", label: "قيد التقديم" },
  { key: "accepted,heading_pickup,picked,delivering", label: "جارية" },
  { key: "delivered,completed", label: "مكتملة" },
  { key: "cancelled", label: "ملغاة" },
];

export default function AdminOrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: orders, isLoading } = useListOrders();
  const orderList: OrderRecord[] = (orders as OrderRecord[]) ?? [];

  const filtered = orderList.filter((o) => {
    const matchesFilter = filter === "all" || filter.split(",").includes(o.status);
    const matchesSearch = search === "" ||
      String(o.id).includes(search) ||
      o.customerId.toLowerCase().includes(search.toLowerCase()) ||
      o.pickupAddress.toLowerCase().includes(search.toLowerCase()) ||
      o.deliveryAddress.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: ADMIN_COLOR, paddingTop: topPad + 16 }]}>
        <Text style={styles.title}>إدارة الطلبات</Text>
        <Text style={styles.subtitle}>{orderList.length} طلب مسجل</Text>
        <View style={[styles.searchBox, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <Feather name="search" size={15} color="rgba(255,255,255,0.7)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="بحث بالرقم أو العنوان..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={{ flex: 1, color: "#fff", fontSize: 13 }}
          />
          {search !== "" && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={15} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: Platform.OS === "web" ? 34 : 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.filters}>
            {FILTER_TABS.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, { backgroundColor: filter === f.key ? ADMIN_COLOR : colors.card, borderColor: filter === f.key ? ADMIN_COLOR : colors.border }]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={{ color: filter === f.key ? "#fff" : colors.textGray, fontSize: 11, fontWeight: "600" }}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        }
        ListFooterComponent={isLoading ? <ActivityIndicator color={ADMIN_COLOR} style={{ marginTop: 20 }} /> : null}
        ListEmptyComponent={
          !isLoading ? <Text style={{ color: colors.textGray, textAlign: "center", marginTop: 40 }}>لا توجد طلبات</Text> : null
        }
        renderItem={({ item }) => {
          const sc = STATUS_COLORS[item.status] ?? { bg: "#F5F5F5", text: "#666" };
          const dateStr = new Date(item.createdAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
          return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <Text style={[styles.orderId, { color: colors.foreground }]}>طلب #{item.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={{ color: sc.text, fontSize: 11, fontWeight: "700" }}>{STATUS_LABELS[item.status] ?? item.status}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Feather name="user" size={13} color={colors.textGray} />
                <Text style={[styles.infoText, { color: colors.textGray }]}>عميل: {item.customerId.slice(-8)}</Text>
                {item.selectedDriverId != null && (
                  <>
                    <Feather name="navigation" size={13} color={colors.textGray} style={{ marginLeft: 8 } as any} />
                    <Text style={[styles.infoText, { color: colors.textGray }]}>سائق #{item.selectedDriverId}</Text>
                  </>
                )}
              </View>
              <View style={styles.routeRow}>
                <Feather name="map-pin" size={13} color="#6C63FF" />
                <Text style={[styles.addr, { color: colors.foreground }]} numberOfLines={1}>{item.pickupAddress}</Text>
              </View>
              <View style={styles.routeRow}>
                <Feather name="flag" size={13} color="#FF6584" />
                <Text style={[styles.addr, { color: colors.foreground }]} numberOfLines={1}>{item.deliveryAddress}</Text>
              </View>
              <View style={styles.cardBottom}>
                <Text style={{ color: colors.textGray, fontSize: 11 }}>{dateStr}</Text>
                {item.finalPrice != null && (
                  <Text style={{ color: "#28A745", fontSize: 13, fontWeight: "700" }}>{item.finalPrice} ₪</Text>
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
  header: { padding: 20, paddingBottom: 16, gap: 6 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginTop: 8 },
  filters: { flexDirection: "row", gap: 8, marginBottom: 4, flexWrap: "wrap" },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 14, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  infoText: { fontSize: 12 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  addr: { fontSize: 13, flex: 1 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
});
