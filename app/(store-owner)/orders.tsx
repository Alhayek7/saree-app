// app/(store-owner)/orders.tsx
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// حالة الطلب
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: keyof typeof Feather.glyphMap }> = {
  pending: { label: "بانتظار سائق", color: "#FFA63D", bgColor: "#FFA63D15", icon: "clock" },
  bidding: { label: "قيد التقديم", color: "#6C63FF", bgColor: "#6C63FF15", icon: "tag" },
  accepted: { label: "تم القبول", color: "#28A745", bgColor: "#28A74515", icon: "check-circle" },
  going: { label: "في الطريق للاستلام", color: "#FFA63D", bgColor: "#FFA63D15", icon: "navigation" },
  picked: { label: "تم الاستلام", color: "#17A2B8", bgColor: "#17A2B815", icon: "truck" },
  delivering: { label: "جاري التوصيل", color: "#6C63FF", bgColor: "#6C63FF15", icon: "truck" },
  delivered: { label: "تم التوصيل", color: "#28A745", bgColor: "#28A74515", icon: "check-circle" },
  completed: { label: "مكتمل", color: "#28A745", bgColor: "#28A74515", icon: "check-circle" },
  cancelled: { label: "ملغي", color: "#DC3545", bgColor: "#DC354515", icon: "x-circle" },
};

// أنواع الفلاتر
type FilterType = "all" | "pending" | "active" | "completed" | "cancelled";

export default function StoreOrdersScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { orders } = useOrders();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // طلبات المتجر (التي تخص صاحب المتجر)
  const storeOrders = orders.filter(o => o.customerId === user?.id);

  // فلترة الطلبات
  const filteredOrders = storeOrders.filter(order => {
    // فلتر الحالة
    if (filterType === "pending" && !["pending", "bidding"].includes(order.status)) return false;
    if (filterType === "active" && !["accepted", "going", "picked", "delivering", "delivered"].includes(order.status)) return false;
    if (filterType === "completed" && order.status !== "completed") return false;
    if (filterType === "cancelled" && order.status !== "cancelled") return false;
    
    // فلتر البحث
    if (searchQuery) {
      return order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // ترتيب الطلبات (الأحدث أولاً)
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // إحصائيات
  const stats = {
    total: storeOrders.length,
    pending: storeOrders.filter(o => ["pending", "bidding"].includes(o.status)).length,
    active: storeOrders.filter(o => ["accepted", "going", "picked", "delivering", "delivered"].includes(o.status)).length,
    completed: storeOrders.filter(o => o.status === "completed").length,
    cancelled: storeOrders.filter(o => o.status === "cancelled").length,
    totalRevenue: storeOrders.reduce((sum, o) => sum + (o.finalPrice || 0), 0),
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleOrderPress = (order: any) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

const filters = [
  { key: "all", label: "الكل", count: stats.total, icon: "list" as const, color: "#6C63FF" },
  { key: "pending", label: "قيد المعالجة", count: stats.pending, icon: "clock" as const, color: "#FFA63D" },
  { key: "active", label: "جارية", count: stats.active, icon: "truck" as const, color: "#17A2B8" },
  { key: "completed", label: "مكتملة", count: stats.completed, icon: "check-circle" as const, color: "#28A745" },
  { key: "cancelled", label: "ملغاة", count: stats.cancelled, icon: "x-circle" as const, color: "#DC3545" },
];``

  const renderOrderCard = ({ item }: { item: any }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const date = new Date(item.createdAt).toLocaleDateString("ar-EG", {
      day: "numeric",
      month: "short",
    });
    
    return (
      <TouchableOpacity
        style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Feather name="hash" size={12} color={colors.textGray} />
            <Text style={[styles.orderId, { color: colors.primary }]}>#{item.id.slice(-6)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
            <Feather name={status.icon} size={10} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.orderAddress}>
          <View style={styles.addressRow}>
            <Feather name="map-pin" size={12} color={colors.primary} />
            <Text style={[styles.addressText, { color: colors.textGray }]} numberOfLines={1}>
              {item.pickupAddress}
            </Text>
          </View>
          <View style={styles.addressRow}>
            <Feather name="flag" size={12} color={colors.secondary} />
            <Text style={[styles.addressText, { color: colors.textGray }]} numberOfLines={1}>
              {item.deliveryAddress}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailItem}>
            <Feather name="package" size={12} color={colors.textLight} />
            <Text style={[styles.detailText, { color: colors.textGray }]} numberOfLines={1}>
              {item.packageDescription || "طرود"}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Feather name="truck" size={12} color={colors.textLight} />
            <Text style={[styles.detailText, { color: colors.textGray }]}>
              {item.vehicleType === "car" ? "سيارة" : item.vehicleType === "bike" ? "باسكليت" : "نقل"}
            </Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.dateContainer}>
            <Feather name="calendar" size={11} color={colors.textLight} />
            <Text style={[styles.dateText, { color: colors.textLight }]}>{date}</Text>
          </View>
          <Text style={[styles.priceText, { color: colors.primary }]}>
            {item.finalPrice || item.selectedOffer?.price || "—"} ₪
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#FF6584", paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الطلبات</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Summary */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="shopping-bag" size={16} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>إجمالي</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="credit-card" size={16} color="#28A745" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.totalRevenue} ₪</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>الإيرادات</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="clock" size={16} color="#FFA63D" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.pending}</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>قيد المعالجة</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="check-circle" size={16} color="#28A745" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.completed}</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>مكتملة</Text>
          </View>
        </View>
      </ScrollView>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filtersContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filterType === filter.key ? filter.color : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setFilterType(filter.key as FilterType)}
            >
              <Feather name={filter.icon} size={14} color={filterType === filter.key ? "#fff" : filter.color} />
              <Text style={[styles.filterText, { color: filterType === filter.key ? "#fff" : filter.color }]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={18} color={colors.textGray} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="ابحث برقم الطلب أو العنوان..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== "" && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Feather name="x" size={18} color={colors.textGray} />
          </TouchableOpacity>
        )}
      </View>

      {/* Orders List */}
      <FlatList
        data={sortedOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color={colors.textLight} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد طلبات</Text>
            <Text style={[styles.emptySub, { color: colors.textGray }]}>
              {searchQuery ? "لا توجد نتائج مطابقة للبحث" : "سيظهر طلبات عملائك هنا"}
            </Text>
          </View>
        }
        renderItem={renderOrderCard}
      />

      {/* Order Details Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>تفاصيل الطلب</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={colors.textGray} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Order ID */}
                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>رقم الطلب</Text>
                  <Text style={[styles.detailValue, { color: colors.primary, fontWeight: "700" }]}>
                    #{selectedOrder.id}
                  </Text>
                </View>

                {/* Status */}
                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>الحالة</Text>
                  <View style={[styles.detailStatus, { backgroundColor: STATUS_CONFIG[selectedOrder.status]?.bgColor, alignSelf: "flex-start" }]}>
                    <Feather name={STATUS_CONFIG[selectedOrder.status]?.icon} size={14} color={STATUS_CONFIG[selectedOrder.status]?.color} />
                    <Text style={[styles.detailStatusText, { color: STATUS_CONFIG[selectedOrder.status]?.color }]}>
                      {STATUS_CONFIG[selectedOrder.status]?.label}
                    </Text>
                  </View>
                </View>

                {/* Addresses */}
                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>عنوان الاستلام</Text>
                  <View style={styles.detailRow}>
                    <Feather name="map-pin" size={14} color={colors.primary} />
                    <Text style={[styles.detailText, { color: colors.textGray }]}>{selectedOrder.pickupAddress}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>عنوان التسليم</Text>
                  <View style={styles.detailRow}>
                    <Feather name="flag" size={14} color={colors.secondary} />
                    <Text style={[styles.detailText, { color: colors.textGray }]}>{selectedOrder.deliveryAddress}</Text>
                  </View>
                </View>

                {/* Package Info */}
                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>تفاصيل الطرد</Text>
                  <View style={styles.detailRow}>
                    <Feather name="package" size={14} color={colors.textGray} />
                    <Text style={[styles.detailText, { color: colors.textGray }]}>{selectedOrder.packageDescription || "غير محدد"}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Feather name="truck" size={14} color={colors.textGray} />
                    <Text style={[styles.detailText, { color: colors.textGray }]}>
                      {selectedOrder.vehicleType === "car" ? "سيارة" : selectedOrder.vehicleType === "bike" ? "باسكليت" : "سيارة نقل"}
                    </Text>
                  </View>
                </View>

                {/* Payment */}
                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>طريقة الدفع</Text>
                  <View style={styles.detailRow}>
                    <Feather name="credit-card" size={14} color={colors.textGray} />
                    <Text style={[styles.detailText, { color: colors.textGray }]}>
                      {selectedOrder.paymentMethod === "cash" ? "💵 نقداً عند الاستلام" : "💳 دفع إلكتروني"}
                    </Text>
                  </View>
                </View>

                {/* Price */}
                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>المبلغ</Text>
                  <Text style={[styles.detailPrice, { color: colors.primary }]}>
                    {selectedOrder.finalPrice || selectedOrder.selectedOffer?.price || "—"} ₪
                  </Text>
                </View>

                {/* Dates */}
                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>تاريخ الإنشاء</Text>
                  <View style={styles.detailRow}>
                    <Feather name="calendar" size={14} color={colors.textGray} />
                    <Text style={[styles.detailText, { color: colors.textGray }]}>{formatDate(selectedOrder.createdAt)}</Text>
                  </View>
                </View>

                {selectedOrder.completedAt && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>تاريخ الإكمال</Text>
                    <View style={styles.detailRow}>
                      <Feather name="check-circle" size={14} color="#28A745" />
                      <Text style={[styles.detailText, { color: colors.textGray }]}>{formatDate(selectedOrder.completedAt)}</Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: "#FF6584" }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  
  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  
  // Stats
  statsScroll: { flexGrow: 0 },
  statsContainer: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  statCard: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, gap: 6 },
  statValue: { fontSize: 14, fontWeight: "700" },
  statLabel: { fontSize: 10 },
  
  // Filters
  filtersScroll: { flexGrow: 0 },
  filtersContainer: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, gap: 10 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: "600" },
  
  // Search
  searchContainer: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginVertical: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  
  // Order Card
  orderCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderIdContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  orderId: { fontSize: 12, fontWeight: "700" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: "600" },
  orderAddress: { gap: 6 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addressText: { fontSize: 12, flex: 1 },
  orderDetails: { flexDirection: "row", gap: 12 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 11, flex: 1 },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  dateContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText: { fontSize: 11 },
  priceText: { fontSize: 14, fontWeight: "800" },
  
  // Empty State
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center" },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 16 },
  modalContainer: { borderRadius: 20, maxHeight: "85%", overflow: "hidden" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E5E5E5" },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalBody: { padding: 16, gap: 16 },
  detailSection: { gap: 6 },
  detailSectionTitle: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  detailValue: { fontSize: 14 },
  detailStatus: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  detailStatusText: { fontSize: 12, fontWeight: "600" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailPrice: { fontSize: 22, fontWeight: "800" },
  modalCloseBtn: { paddingVertical: 14, marginHorizontal: 16, marginBottom: 16, borderRadius: 12, alignItems: "center" },
  modalCloseText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});