// app/(driver)/available-orders.tsx
import { useOrders } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

const VEHICLE_TYPES = [
  { id: "all", label: "الكل", icon: "list", color: "#6C63FF" },
  { id: "car", label: "سيارة", icon: "car", color: "#28A745" },
  { id: "bike", label: "باسكليت", icon: "bike", color: "#FFA63D" },
  { id: "truck", label: "نقل", icon: "truck", color: "#FF6584" },
];

const VEHICLE_LABELS: Record<string, string> = {
  car: "🚗 سيارة",
  bike: "🚲 باسكليت",
  truck: "🚛 سيارة نقل",
};

export default function AvailableOrdersScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getSearchingOrders, submitDriverBid, rejectOffer } = useOrders();

  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [bidPrice, setBidPrice] = useState("");
  const [bidTime, setBidTime] = useState("");
  const [showBidModal, setShowBidModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const orders = getSearchingOrders();
  const driverId = user?.id || "";
  const driverName = user?.fullName || "سائق";
  const driverVehicle = user?.vehicleType || "car";

  // فلترة الطلبات
  const filteredOrders = orders.filter(order => {
    // فلتر نوع المركبة
    if (selectedVehicle !== "all" && order.vehicleType !== selectedVehicle) {
      return false;
    }
    // فلتر البحث
    if (searchQuery) {
      return (
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleAccept = (order: any) => {
    setSelectedOrder(order);
    setBidPrice("");
    setBidTime("");
    setShowBidModal(true);
  };

  const handleSubmitBid = async () => {
    const price = parseFloat(bidPrice);
    const minutes = parseInt(bidTime);

    if (isNaN(price) || price < 3) {
      Alert.alert("⚠️ تنبيه", "الرجاء إدخال سعر صالح (3 شيكل على الأقل)");
      return;
    }

    if (isNaN(minutes) || minutes < 1) {
      Alert.alert("⚠️ تنبيه", "الرجاء إدخال وقت مقدر صالح (دقيقة واحدة على الأقل)");
      return;
    }

    setSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const bid: any = {
      driverId: driverId,
      driverName: driverName,
      driverPhone: user?.phone || "",
      driverRating: user?.rating || 4.5,
      totalDeliveries: user?.totalDeliveries || 0,
      vehicleType: selectedOrder.vehicleType,
      price: price,
      estimatedMinutes: minutes,
    };

    await submitDriverBid(selectedOrder.id, bid);

    setSubmitting(false);
    setShowBidModal(false);
    Alert.alert("✅ تم الإرسال", "تم إرسال عرضك إلى العميل. في انتظار الموافقة.");
  };

  const handleReject = (orderId: string) => {
    Haptics.selectionAsync();
    Alert.alert(
      "رفض الطلب",
      "هل أنت متأكد من رفض هذا الطلب؟",
      [
        { text: "لا", style: "cancel" },
        {
          text: "نعم، رفض",
          style: "destructive",
          onPress: () => {
            rejectOffer(orderId, driverId);
            Alert.alert("❌ تم الرفض", "تم رفض الطلب");
          },
        },
      ]
    );
  };

  // حساب عدد الطلبات لكل نوع مركبة
  const counts = {
    all: orders.length,
    car: orders.filter(o => o.vehicleType === "car").length,
    bike: orders.filter(o => o.vehicleType === "bike").length,
    truck: orders.filter(o => o.vehicleType === "truck").length,
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>الطلبات المتاحة</Text>
        <View style={[styles.headerBadge, { backgroundColor: colors.primary + "18" }]}>
          <Text style={[styles.headerBadgeText, { color: colors.primary }]}>{filteredOrders.length}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
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

      {/* Vehicle Filters - Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {VEHICLE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.filterTab,
              {
                backgroundColor: selectedVehicle === type.id ? type.color : colors.card,
                borderColor: selectedVehicle === type.id ? type.color : colors.border,
              },
            ]}
            onPress={() => {
              setSelectedVehicle(type.id);
              Haptics.selectionAsync();
            }}
          >
            <Feather name={type.icon as any} size={16} color={selectedVehicle === type.id ? "#fff" : type.color} />
            <Text
              style={[
                styles.filterTabText,
                { color: selectedVehicle === type.id ? "#fff" : type.color },
              ]}
            >
              {type.label}
            </Text>
            <View style={[styles.filterBadge, { backgroundColor: selectedVehicle === type.id ? "rgba(255,255,255,0.2)" : type.color + "20" }]}>
              <Text style={[styles.filterBadgeText, { color: selectedVehicle === type.id ? "#fff" : type.color }]}>
                {counts[type.id as keyof typeof counts]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={64} color={colors.textLight} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد طلبات</Text>
            <Text style={[styles.emptySub, { color: colors.textGray }]}>
              {searchQuery ? "لا توجد نتائج مطابقة للبحث" : "لا توجد طلبات متاحة حالياً"}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const hasMyBid = order.offers?.some((o: any) => o.driverId === driverId);
            const isCompatible = order.vehicleType === driverVehicle;
            const vehicleInfo = VEHICLE_LABELS[order.vehicleType];
            
            return (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Order Header */}
                <View style={styles.orderHeader}>
                  <View style={[styles.orderIdBadge, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[styles.orderId, { color: colors.primary }]}>#{order.id.slice(-6)}</Text>
                  </View>
                  <View style={[styles.vehicleTag, { backgroundColor: isCompatible ? "#28A74515" : "#FFC10715" }]}>
                    <Text style={[styles.vehicleTagText, { color: isCompatible ? "#28A745" : "#FFC107" }]}>
                      {vehicleInfo}
                    </Text>
                  </View>
                </View>

                {/* Addresses */}
                <View style={styles.addressSection}>
                  <View style={styles.addressRow}>
                    <View style={[styles.addressDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.addressLabel, { color: colors.textGray }]}>من:</Text>
                    <Text style={[styles.addressText, { color: colors.foreground }]} numberOfLines={1}>
                      {order.pickupAddress}
                    </Text>
                  </View>
                  <View style={styles.addressRow}>
                    <View style={[styles.addressDot, { backgroundColor: colors.secondary }]} />
                    <Text style={[styles.addressLabel, { color: colors.textGray }]}>إلى:</Text>
                    <Text style={[styles.addressText, { color: colors.foreground }]} numberOfLines={1}>
                      {order.deliveryAddress}
                    </Text>
                  </View>
                </View>

                {/* Package Info */}
                <View style={[styles.packageBox, { backgroundColor: colors.muted }]}>
                  <Feather name="package" size={14} color={colors.textGray} />
                  <Text style={[styles.packageText, { color: colors.textGray }]} numberOfLines={1}>
                    {order.packageDescription || "طرود"}
                  </Text>
                </View>

                {/* Payment Method */}
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, { color: colors.textLight }]}>الدفع:</Text>
                  <Text style={[styles.paymentValue, { color: order.paymentMethod === "cash" ? "#28A745" : "#1E88E5" }]}>
                    {order.paymentMethod === "cash" ? "💵 نقداً" : "💳 إلكتروني"}
                  </Text>
                  <View style={{ flex: 1 }} />
                  <View style={[styles.estimateChip, { backgroundColor: colors.primary + "10" }]}>
                    <Feather name="trending-up" size={10} color={colors.primary} />
                    <Text style={[styles.estimateText, { color: colors.primary }]}>
                      ~{Math.floor(Math.random() * 30) + 10} ₪
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                {hasMyBid ? (
                  <View style={[styles.pendingBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.pendingText, { color: colors.primary }]}>بانتظار رد العميل</Text>
                  </View>
                ) : (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.acceptBtn, { backgroundColor: isCompatible ? colors.secondary : colors.muted }]}
                      onPress={() => handleAccept(order)}
                      disabled={!isCompatible}
                      activeOpacity={0.85}
                    >
                      <Feather name="check" size={18} color="#fff" />
                      <Text style={styles.acceptBtnText}>تقديم عرض</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rejectBtn, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive }]}
                      onPress={() => handleReject(order.id)}
                      activeOpacity={0.85}
                    >
                      <Feather name="x" size={18} color={colors.destructive} />
                      <Text style={[styles.rejectBtnText, { color: colors.destructive }]}>رفض</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Bid Modal */}
      <Modal visible={showBidModal} transparent animationType="slide" onRequestClose={() => setShowBidModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>💰 تقديم عرض</Text>
              <TouchableOpacity onPress={() => setShowBidModal(false)}>
                <Feather name="x" size={24} color={colors.textGray} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>💵 السعر المقترح (شيكل)</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <Text style={styles.currencySymbol}>₪</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textLight}
                    value={bidPrice}
                    onChangeText={setBidPrice}
                    autoFocus
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>⏰ الوقت المتوقع (دقائق)</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textLight}
                    value={bidTime}
                    onChangeText={setBidTime}
                  />
                  <Text style={styles.inputUnit}>دقيقة</Text>
                </View>
              </View>

              <View style={[styles.infoBox, { backgroundColor: colors.primary + "10" }]}>
                <Feather name="info" size={14} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.textGray }]}>
                  سيتم عرض عرضك على العميل مع عروض السائقين الآخرين
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelModalBtn, { borderColor: colors.border }]}
                onPress={() => setShowBidModal(false)}
              >
                <Text style={{ color: colors.textGray }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitModalBtn, { backgroundColor: colors.secondary }]}
                onPress={handleSubmitBid}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitModalBtnText}>إرسال العرض</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center" },
  headerBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, minWidth: 28, alignItems: "center" },
  headerBadgeText: { fontSize: 14, fontWeight: "700" },
  
  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  
  // Filters Tabs
  filtersContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
  },
  filterTabText: { fontSize: 13, fontWeight: "600" },
  filterBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, minWidth: 22, alignItems: "center" },
  filterBadgeText: { fontSize: 10, fontWeight: "700" },
  
  // Empty State
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center" },
  
  // Order Card
  orderCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderIdBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  orderId: { fontSize: 12, fontWeight: "700" },
  vehicleTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  vehicleTagText: { fontSize: 11, fontWeight: "600" },
  
  // Addresses
  addressSection: { gap: 8 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addressDot: { width: 8, height: 8, borderRadius: 4 },
  addressLabel: { fontSize: 12, fontWeight: "500", width: 35 },
  addressText: { fontSize: 12, flex: 1 },
  
  // Package
  packageBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10 },
  packageText: { fontSize: 12, flex: 1 },
  
  // Payment
  paymentRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  paymentLabel: { fontSize: 11 },
  paymentValue: { fontSize: 12, fontWeight: "600" },
  estimateChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  estimateText: { fontSize: 10, fontWeight: "600" },
  
  // Action Buttons
  actionButtons: { flexDirection: "row", gap: 12, marginTop: 4 },
  acceptBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12 },
  acceptBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  rejectBtnText: { fontSize: 14, fontWeight: "600" },
  pendingBox: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  pendingText: { fontSize: 13, fontWeight: "600" },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  modalContainer: { width: "100%", borderRadius: 20, overflow: "hidden" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E5E5E5" },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalBody: { padding: 16, gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 14, fontWeight: "600" },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 48 },
  currencySymbol: { fontSize: 18, fontWeight: "700", color: "#28A745", marginRight: 8 },
  input: { flex: 1, fontSize: 16, textAlign: "right" },
  inputUnit: { fontSize: 13, color: "#6C757D", marginLeft: 8 },
  infoBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10 },
  infoText: { fontSize: 12, flex: 1 },
  modalFooter: { flexDirection: "row", gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: "#E5E5E5" },
  cancelModalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  submitModalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  submitModalBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});