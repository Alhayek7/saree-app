import { useAuth } from "@/context/AuthContext";
import { useOrders, Order, OrderStatus } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: keyof typeof Feather.glyphMap }> = {
  searching: { label: "يبحث عن سائق", color: "#FFA63D", icon: "search" },
  bidding:   { label: "عروض متاحة",   color: "#6C63FF", icon: "tag" },
  accepted:  { label: "السائق في الطريق", color: "#28A745", icon: "navigation" },
  picked:    { label: "في الطريق",    color: "#17A2B8", icon: "truck" },
  delivered: { label: "بانتظار التأكيد", color: "#FF6584", icon: "check-circle" },
  completed: { label: "مكتمل",        color: "#28A745", icon: "check-circle" },
  cancelled: { label: "ملغي",          color: "#DC3545", icon: "x-circle" },
};

const VEHICLE_LABELS: Record<string, string> = {
  car: "🚗 سيارة",
  bike: "🚲 باسكليت",
  truck: "🚛 سيارة نقل",
};

type FilterKey = "all" | "active" | "completed" | "cancelled";
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "active", label: "نشط" },
  { key: "completed", label: "مكتمل" },
  { key: "cancelled", label: "ملغي" },
];

function filterOrders(orders: Order[], key: FilterKey): Order[] {
  if (key === "active") return orders.filter((o) => !["completed", "cancelled"].includes(o.status));
  if (key === "completed") return orders.filter((o) => o.status === "completed");
  if (key === "cancelled") return orders.filter((o) => o.status === "cancelled");
  return orders;
}

export default function OrdersScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getMyOrders } = useOrders();
  const [filter, setFilter] = useState<FilterKey>("all");

  const myOrders = user ? getMyOrders(user.id) : [];
  const filtered = filterOrders(myOrders, filter);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const stats = {
    total: myOrders.length,
    active: myOrders.filter((o) => !["completed", "cancelled"].includes(o.status)).length,
    completed: myOrders.filter((o) => o.status === "completed").length,
  };

  const renderItem = ({ item: order }: { item: Order }) => {
    const cfg = STATUS_CONFIG[order.status];
    const isBidding = order.status === "bidding";
    const isDelivered = order.status === "delivered";

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() =>
          router.push(isBidding
            ? { pathname: "/order-offers", params: { orderId: order.id } }
            : { pathname: "/track-order", params: { orderId: order.id } }
          )
        }
        activeOpacity={0.75}
      >
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardIdRow}>
            <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
            <Text style={[styles.cardId, { color: colors.foreground }]}>#{order.id}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: cfg.color + "18" }]}>
            <Feather name={cfg.icon} size={11} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Package + Vehicle */}
        <Text style={[styles.pkgDesc, { color: colors.foreground }]}>{order.packageDescription}</Text>
        <Text style={[styles.vehicle, { color: colors.textGray }]}>{VEHICLE_LABELS[order.vehicleType]}</Text>

        {/* Route */}
        <View style={[styles.routeBox, { backgroundColor: colors.muted }]}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.routeAddr, { color: colors.foreground }]} numberOfLines={1}>{order.pickupAddress}</Text>
          </View>
          <View style={[styles.routeConnector, { borderColor: colors.border }]} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: colors.secondary }]} />
            <Text style={[styles.routeAddr, { color: colors.foreground }]} numberOfLines={1}>{order.deliveryAddress}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          {order.finalPrice ? (
            <View style={styles.priceTag}>
              <Feather name="dollar-sign" size={13} color={colors.primary} />
              <Text style={[styles.priceText, { color: colors.primary }]}>{order.finalPrice} ₪ نقداً عند الاستلام</Text>
            </View>
          ) : (
            <View />
          )}
          {order.selectedOffer && (
            <View style={styles.driverTag}>
              <Feather name="user" size={12} color={colors.textGray} />
              <Text style={[styles.driverText, { color: colors.textGray }]}>{order.selectedOffer.driverName}</Text>
            </View>
          )}
        </View>

        {/* Action banners */}
        {isBidding && (
          <View style={[styles.actionBanner, { backgroundColor: "#6C63FF12", borderColor: "#6C63FF40" }]}>
            <Feather name="tag" size={14} color="#6C63FF" />
            <Text style={[styles.actionBannerText, { color: "#6C63FF" }]}>عروض السائقين جاهزة — اختر الأنسب</Text>
            <Feather name="chevron-left" size={14} color="#6C63FF" />
          </View>
        )}
        {isDelivered && (
          <View style={[styles.actionBanner, { backgroundColor: "#FF658412", borderColor: "#FF658440" }]}>
            <Feather name="check-circle" size={14} color="#FF6584" />
            <Text style={[styles.actionBannerText, { color: "#FF6584" }]}>اضغط لتأكيد استلام الطرد وإتمام الدفع</Text>
            <Feather name="chevron-left" size={14} color="#FF6584" />
          </View>
        )}

        {/* Rating */}
        {order.status === "completed" && (
          <View style={[styles.ratingRow, { borderTopColor: colors.border }]}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Feather key={s} name="star" size={13}
                  color={order.rating && s <= order.rating ? "#FFC107" : colors.border} />
              ))}
            </View>
            {!order.rating && (
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/rate-driver", params: { orderId: order.id } })}
              >
                <Text style={[styles.rateNow, { color: colors.primary }]}>قيّم السائق</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: topPad + 14, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>طلباتي</Text>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.stat, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.primary }]}>إجمالي</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: "#FFA63D18" }]}>
            <Text style={[styles.statNum, { color: "#FFA63D" }]}>{stats.active}</Text>
            <Text style={[styles.statLabel, { color: "#FFA63D" }]}>نشط</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: "#28A74518" }]}>
            <Text style={[styles.statNum, { color: "#28A745" }]}>{stats.completed}</Text>
            <Text style={[styles.statLabel, { color: "#28A745" }]}>مكتمل</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === "web" ? 34 : 100, gap: 12 }}
        ListHeaderComponent={
          <View style={styles.filters}>
            {FILTERS.map((f) => {
              const count = filterOrders(myOrders, f.key).length;
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={[
                    styles.filterChip,
                    { backgroundColor: filter === f.key ? colors.primary : colors.card, borderColor: filter === f.key ? colors.primary : colors.border },
                  ]}
                >
                  <Text style={[styles.filterLabel, { color: filter === f.key ? "#fff" : colors.textGray }]}>
                    {f.label} {count > 0 ? `(${count})` : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={52} color={colors.textLight} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد طلبات</Text>
            <Text style={[styles.emptySub, { color: colors.textGray }]}>
              {filter === "all" ? "أنشئ طلبك الأول من الصفحة الرئيسية" : "لا توجد طلبات في هذا التصنيف"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, gap: 14 },
  title: { fontSize: 22, fontWeight: "800" },
  statsRow: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "600" },
  filters: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterLabel: { fontSize: 13, fontWeight: "600" },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardIdRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardId: { fontSize: 13, fontWeight: "700" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "600" },
  pkgDesc: { fontSize: 15, fontWeight: "600" },
  vehicle: { fontSize: 12, marginTop: -4 },
  routeBox: { borderRadius: 10, padding: 10, gap: 4 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeAddr: { fontSize: 13, flex: 1 },
  routeConnector: { height: 14, width: 1, borderLeftWidth: 1, borderStyle: "dashed", marginRight: "auto", marginLeft: 4 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  priceText: { fontSize: 13, fontWeight: "700" },
  driverTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  driverText: { fontSize: 12 },
  actionBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 10, borderWidth: 1 },
  actionBannerText: { flex: 1, fontSize: 12, fontWeight: "600" },
  ratingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, paddingTop: 10 },
  stars: { flexDirection: "row", gap: 3 },
  rateNow: { fontSize: 13, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center" },
});
