// @ts-nocheck

import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";

const ADMIN_COLOR = "#1E88E5";

const STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار السائق",
  bidding: "قيد التقديم",
  assigned: "تم التعيين",
  picked_up: "تم الاستلام",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FFF8E1", text: "#FFA000" },
  bidding: { bg: "#EDE7FF", text: "#6C63FF" },
  assigned: { bg: "#E3F2FD", text: "#1E88E5" },
  picked_up: { bg: "#E8F5E9", text: "#28A745" },
  delivered: { bg: "#E8F5E9", text: "#28A745" },
  cancelled: { bg: "#FFEBEE", text: "#DC3545" },
};

const FILTER_TABS = [
  { key: "all", label: "الكل" },
  { key: "pending,bidding", label: "قيد التقديم" },
  { key: "assigned,picked_up", label: "جارية" },
  { key: "delivered", label: "مكتملة" },
  { key: "cancelled", label: "ملغاة" },
];

export default function AdminOrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, customer:profiles!customer_id(full_name, phone_number)")
        .order("created_at", { ascending: false });
      if (!error && data) setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesFilter = filter === "all" || filter.split(",").includes(o.status);
    const matchesSearch = search === "" ||
      o.id.includes(search) ||
      o.pickup_address?.toLowerCase().includes(search.toLowerCase()) ||
      o.dropoff_address?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: ADMIN_COLOR, paddingTop: topPad + 16 }]}>
        <Text style={styles.title}>إدارة الطلبات</Text>
        <Text style={styles.subtitle}>{orders.length} طلب مسجل</Text>
        <View style={[styles.searchBox, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <Feather name="search" size={15} color="rgba(255,255,255,0.7)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="بحث بالعنوان..."
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
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onRefresh={loadOrders}
        refreshing={isLoading}
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
        ListEmptyComponent={
          !isLoading ? <Text style={{ color: colors.textGray, textAlign: "center", marginTop: 40 }}>لا توجد طلبات</Text> : <ActivityIndicator color={ADMIN_COLOR} style={{ marginTop: 40 }} />
        }
        renderItem={({ item }) => {
          const sc = STATUS_COLORS[item.status] ?? { bg: "#F5F5F5", text: "#666" };
          const dateStr = new Date(item.created_at).toLocaleDateString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
          return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <Text style={[styles.orderId, { color: colors.foreground }]}>طلب #{item.id.slice(-6)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={{ color: sc.text, fontSize: 11, fontWeight: "700" }}>{STATUS_LABELS[item.status] ?? item.status}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Feather name="user" size={13} color={colors.textGray} />
                <Text style={[styles.infoText, { color: colors.textGray }]}>{item.customer?.full_name ?? "عميل"}</Text>
              </View>
              <View style={styles.routeRow}>
                <Feather name="map-pin" size={13} color="#6C63FF" />
                <Text style={[styles.addr, { color: colors.foreground }]} numberOfLines={1}>{item.pickup_address}</Text>
              </View>
              <View style={styles.routeRow}>
                <Feather name="flag" size={13} color="#FF6584" />
                <Text style={[styles.addr, { color: colors.foreground }]} numberOfLines={1}>{item.delivery_address}</Text>
              </View>
              <View style={styles.cardBottom}>
                <Text style={{ color: colors.textGray, fontSize: 11 }}>{dateStr}</Text>
                {item.final_price != null && (
                  <Text style={{ color: "#28A745", fontSize: 13, fontWeight: "700" }}>{item.final_price} ₪</Text>
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
  infoRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText: { fontSize: 12 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  addr: { fontSize: 13, flex: 1 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
});