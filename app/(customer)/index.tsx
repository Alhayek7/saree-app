import { useAuth } from "@/context/AuthContext";
import { useOrders, Order, OrderStatus } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from "@/context/CartContext";

import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: keyof typeof Feather.glyphMap }> = {
  searching: { label: "جاري البحث عن سائقين...", color: "#FFA63D", icon: "search" },
  bidding:   { label: "عروض أسعار متاحة!", color: "#6C63FF", icon: "tag" },
  accepted:  { label: "السائق في الطريق إليك", color: "#28A745", icon: "navigation" },
  picked:    { label: "الطرد في الطريق", color: "#17A2B8", icon: "truck" },
  delivered: { label: "بانتظار تأكيد الاستلام", color: "#FF6584", icon: "check-circle" },
  completed: { label: "تم التوصيل", color: "#28A745", icon: "check-circle" },
  cancelled: { label: "ملغي", color: "#DC3545", icon: "x-circle" },
};

const VEHICLE_LABELS: Record<string, string> = {
  car: "سيارة 🚗",
  bike: "باسكليت 🚲",
  truck: "سيارة نقل 🚛",
};

function ActiveOrderCard({ order }: { order: Order }) {
  const colors = useColors();
  const router = useRouter();
  const cfg = STATUS_CONFIG[order.status];
  const isSearching = order.status === "searching";
  const isBidding = order.status === "bidding";

  return (
    <TouchableOpacity
      style={[styles.activeCard, { backgroundColor: colors.primary }]}
      onPress={() =>
        router.push(isBidding
          ? { pathname: "/order-offers", params: { orderId: order.id } }
          : { pathname: "/track-order", params: { orderId: order.id } }
        )
      }
      activeOpacity={0.88}
    >
      <View style={styles.activePulse}>
        {isSearching ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Feather name={cfg.icon} size={18} color="#fff" />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.activeBadge}>طلب نشط</Text>
        <Text style={styles.activeStatus}>{cfg.label}</Text>
        <Text style={styles.activeAddr} numberOfLines={1}>
          {order.pickupAddress} ← {order.deliveryAddress}
        </Text>
      </View>
      <Feather name={isBidding ? "chevron-left" : "chevron-left"} size={20} color="rgba(255,255,255,0.7)" />
    </TouchableOpacity>
    
  );
  
}


function OrderCard({ order }: { order: Order }) {
  const colors = useColors();
  const router = useRouter();
  const cfg = STATUS_CONFIG[order.status];
  const isBidding = order.status === "bidding";
  const isActive = !["completed", "cancelled"].includes(order.status);

  return (
    <TouchableOpacity
      style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() =>
        router.push(isBidding
          ? { pathname: "/order-offers", params: { orderId: order.id } }
          : { pathname: "/track-order", params: { orderId: order.id } }
        )
      }
      activeOpacity={0.75}
    >
      <View style={styles.orderCardRow}>
        <View style={[styles.orderIcon, { backgroundColor: cfg.color + "18" }]}>
          <Feather name={cfg.icon} size={18} color={cfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.orderTopRow}>
            <Text style={[styles.orderId, { color: colors.foreground }]}>#{order.id}</Text>
            <View style={[styles.statusPill, { backgroundColor: cfg.color + "18" }]}>
              <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
          <Text style={[styles.orderDesc, { color: colors.textGray }]} numberOfLines={1}>
            {order.packageDescription}  •  {VEHICLE_LABELS[order.vehicleType]}
          </Text>
          <View style={styles.routeRow}>
            <Feather name="map-pin" size={11} color={colors.primary} />
            <Text style={[styles.routeText, { color: colors.textGray }]} numberOfLines={1}>{order.pickupAddress}</Text>
          </View>
          <View style={styles.routeRow}>
            <Feather name="flag" size={11} color={colors.secondary} />
            <Text style={[styles.routeText, { color: colors.textGray }]} numberOfLines={1}>{order.deliveryAddress}</Text>
          </View>
        </View>
      </View>

      {order.finalPrice && (
        <View style={[styles.priceRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.priceLabel, { color: colors.textGray }]}>المبلغ عند الاستلام</Text>
          <Text style={[styles.priceValue, { color: colors.primary }]}>{order.finalPrice} ₪</Text>
        </View>
      )}

      {isBidding && (
        <View style={[styles.biddingBanner, { backgroundColor: "#6C63FF18" }]}>
          <Feather name="tag" size={14} color="#6C63FF" />
          <Text style={[styles.biddingText, { color: "#6C63FF" }]}>عروض جاهزة — اضغط لاختيار سائق</Text>
          <Feather name="chevron-left" size={14} color="#6C63FF" />
        </View>
      )}

      {order.status === "delivered" && (
        <View style={[styles.biddingBanner, { backgroundColor: "#FF658418" }]}>
          <Feather name="check-circle" size={14} color="#FF6584" />
          <Text style={[styles.biddingText, { color: "#FF6584" }]}>اضغط لتأكيد استلام الطرد</Text>
          <Feather name="chevron-left" size={14} color="#FF6584" />
        </View>
      )}

      {order.status === "completed" && order.rating && (
        <View style={[styles.ratingRow, { borderTopColor: colors.border }]}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Feather key={s} name="star" size={13} color={s <= order.rating! ? "#FFC107" : colors.border} />
          ))}
          {order.ratingComment && (
            <Text style={[styles.ratingComment, { color: colors.textGray }]} numberOfLines={1}>{order.ratingComment}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function CustomerHome() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = React.useState(0);
React.useEffect(() => {
  const loadUnreadCount = async () => {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        const count = notifications.filter((n: any) => !n.read).length;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };
  loadUnreadCount();
}, []);
  const { user } = useAuth();
  const { getMyOrders } = useOrders();
const { getTotalItems } = useCart(); 
  const myOrders = user ? getMyOrders(user.id) : [];
  const activeOrders = myOrders.filter((o) => !["completed", "cancelled"].includes(o.status));
  const recentOrders = myOrders.slice(0, 5);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPad + 16 }]}>
<View style={styles.headerRow}>
  <View>
    <Text style={styles.greeting}>أهلاً 👋</Text>
    <Text style={styles.userName}>{user?.fullName ?? "مستخدم"}</Text>
  </View>
<View style={styles.headerActions}>

  <TouchableOpacity style={styles.cartBtn} onPress={() => router.push("/(customer)/cart")}>
    <Feather name="shopping-cart" size={20} color="#fff" />
    {getTotalItems > 0 && (
      <View style={styles.cartBadge}>
        <Text style={styles.cartBadgeText}>{getTotalItems > 9 ? "9+" : getTotalItems}</Text>
      </View>
    )}
  </TouchableOpacity>
  {/* زر الإشعارات */}
  <TouchableOpacity style={styles.notifBtn} onPress={() => router.push("/notifications" as any)}>
    <Feather name="bell" size={20} color="#fff" />
    {unreadCount > 0 && (
      <View style={[styles.badge, { backgroundColor: "#FF3B30" }]}>
        <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
      </View>
    )}
  </TouchableOpacity>
  
  {/* زر الأسئلة الشائعة */}
  <TouchableOpacity style={styles.faqBtn} onPress={() => router.push("/faq" as any)}>
    <Feather name="help-circle" size={20} color="#fff" />
  </TouchableOpacity>
  
  {/* زر عن التطبيق */}
  {/* <TouchableOpacity style={styles.aboutBtn} onPress={() => router.push("/about" as any)}>
    <Feather name="info" size={20} color="#fff" />
  </TouchableOpacity> */}
</View>
</View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Active orders */}
        {activeOrders.length > 0 && (
          <View style={styles.section}>
            {activeOrders.map((o) => <ActiveOrderCard key={o.id} order={o} />)}
          </View>
        )}

        {/* New order button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.newOrderBtn, { backgroundColor: colors.secondary }]}
            onPress={() => router.push("/new-order")}
            activeOpacity={0.85}
          >
            <View style={styles.newOrderBtnInner}>
              <View style={styles.newOrderIconBox}>
                <Feather name="plus" size={26} color="#fff" />
              </View>
              <View>
                <Text style={styles.newOrderBtnTitle}>إنشاء طلب توصيل جديد</Text>
                <Text style={styles.newOrderBtnSub}>اختر المركبة المناسبة واحصل على أفضل سعر</Text>
              </View>
            </View>
            <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
        {/* Store Products Button */}
<View style={styles.section}>
  <TouchableOpacity
    style={[styles.storeBtn, { backgroundColor: "#FF6584" }]}
    onPress={() => router.push("/(customer)/store-products")}
    activeOpacity={0.85}
  >
    <View style={styles.storeBtnInner}>
      <View style={[styles.storeIconBox, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
        <Feather name="shopping-bag" size={24} color="#fff" />
      </View>
      <View>
        <Text style={styles.storeBtnTitle}>منتجات المتاجر</Text>
        <Text style={styles.storeBtnSub}>تسوق من منتجات المتاجر المحلية</Text>
      </View>
    </View>
    <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.7)" />
  </TouchableOpacity>
</View>

        

        {/* Order history */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>سجل الطلبات</Text>
            {myOrders.length > 5 && (
              <TouchableOpacity onPress={() => router.push("/(customer)/orders")}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل ({myOrders.length})</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentOrders.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="package" size={40} color={colors.textLight} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد طلبات بعد</Text>
              <Text style={[styles.emptySub, { color: colors.textGray }]}>أنشئ طلبك الأول الآن</Text>
            </View>
          ) : (
            recentOrders.map((o) => <OrderCard key={o.id} order={o} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  userName: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 },
  // notifBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" },
  section: { paddingHorizontal: 16, marginTop: 16, gap: 10 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  seeAll: { fontSize: 13, fontWeight: "600" },
  activeCard: { borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  activePulse: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  activeBadge: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "600", marginBottom: 2 },
  activeStatus: { color: "#fff", fontSize: 15, fontWeight: "700" },
  activeAddr: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  newOrderBtn: { borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center" },
  newOrderBtnInner: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  newOrderIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  newOrderBtnTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  newOrderBtnSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  orderCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  orderCardRow: { flexDirection: "row", gap: 12 },
  orderIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  orderTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  orderId: { fontSize: 13, fontWeight: "700" },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: "600" },
  orderDesc: { fontSize: 12, marginBottom: 4 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  routeText: { fontSize: 12, flex: 1 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, marginTop: 10, paddingTop: 10 },
  priceLabel: { fontSize: 12 },
  priceValue: { fontSize: 16, fontWeight: "800" },
  biddingBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 8, padding: 10, marginTop: 10 },
  biddingText: { flex: 1, fontSize: 12, fontWeight: "600" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, borderTopWidth: 1, marginTop: 10, paddingTop: 10 },
  ratingComment: { fontSize: 12, marginRight: 6, flex: 1 },
  emptyBox: { padding: 36, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySub: { fontSize: 13 },
  notifBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: "rgba(255,255,255,0.18)", 
    justifyContent: "center", 
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },

  headerActions: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
},
faqBtn: {
  width: 40,
  height: 40,
  borderRadius: 12,
  backgroundColor: "rgba(255,255,255,0.18)",
  justifyContent: "center",
  alignItems: "center",
},

aboutBtn: {
  width: 40,
  height: 40,
  borderRadius: 12,
  backgroundColor: "rgba(255,255,255,0.18)",
  justifyContent: "center",
  alignItems: "center",
},

storeBtn: {
  borderRadius: 16,
  padding: 18,
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#FF6584",
},
storeBtnInner: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  gap: 14,
},
storeIconBox: {
  width: 48,
  height: 48,
  borderRadius: 14,
  backgroundColor: "rgba(255,255,255,0.2)",
  justifyContent: "center",
  alignItems: "center",
},
storeBtnTitle: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "700",
},
storeBtnSub: {
  color: "rgba(255,255,255,0.8)",
  fontSize: 12,
  marginTop: 2,
},
cartBtn: {
  width: 40,
  height: 40,
  borderRadius: 12,
  backgroundColor: "rgba(255,255,255,0.18)",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
},
cartBadge: {
  position: "absolute",
  top: -4,
  right: -4,
  minWidth: 16,
  height: 16,
  borderRadius: 8,
  backgroundColor: "#FF3B30",
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 4,
},
cartBadgeText: {
  color: "#fff",
  fontSize: 9,
  fontWeight: "bold",
},
});
