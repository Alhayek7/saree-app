// app/(driver)/earnings.tsx
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Period = "week" | "month" | "year" | "all";

interface OrderDetail {
  id: string;
  pickupAddress: string;
  deliveryAddress: string;
  finalPrice: number;
  createdAt: string;
  completedAt?: string;
  rating?: number;
  ratingComment?: string;
  packageDescription?: string;
  vehicleType?: string;
}

export default function EarningsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getMyOrders } = useOrders();
  
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("month");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const myOrders = getMyOrders(user?.id || "");
  const completedOrders = myOrders.filter(o => o.status === "completed");
  
  // فلترة الطلبات حسب الفترة الزمنية
  const getOrdersByPeriod = useCallback((period: Period): typeof completedOrders => {
    const now = new Date();
    const startDate = new Date();
    
    if (period === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === "year") {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      return completedOrders;
    }
    
    return completedOrders.filter(o => new Date(o.createdAt) >= startDate);
  }, [completedOrders]);
  
  const filteredOrders = getOrdersByPeriod(selectedPeriod);
  
  // حساب الإحصائيات
  const totalEarnings = filteredOrders.reduce((sum, o) => sum + (o.finalPrice || 0), 0);
  const totalDeliveries = filteredOrders.length;
  const avgPerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;
  const avgRating = completedOrders.filter(o => o.rating).reduce((sum, o) => sum + (o.rating || 0), 0) / (completedOrders.filter(o => o.rating).length || 1);
  
  // حساب المكافأة القادمة
  const deliveriesToNextBonus = 100 - (completedOrders.length % 100);
  const isNearBonus = deliveriesToNextBonus <= 5 && deliveriesToNextBonus > 0;
  const bonusAmount = 100;
  
  const periods: { key: Period; label: string }[] = [
    { key: "week", label: "أسبوع" },
    { key: "month", label: "شهر" },
    { key: "year", label: "سنة" },
    { key: "all", label: "الكل" },
  ];
  
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  const handleOrderPress = (order: typeof completedOrders[0]) => {
    setSelectedOrder({
      id: order.id,
      pickupAddress: order.pickupAddress,
      deliveryAddress: order.deliveryAddress,
      finalPrice: order.finalPrice || 0,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      rating: order.rating,
      ratingComment: order.ratingComment,
      packageDescription: order.packageDescription,
      vehicleType: order.vehicleType,
    });
    setShowOrderDetail(true);
    Haptics.selectionAsync();
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
  
  const statsCards = [
    { label: "إجمالي الأرباح", value: `${totalEarnings} ₪`, icon: "wallet", color: "#28A745", key: "total" },
    { label: "عدد التوصيلات", value: `${totalDeliveries}`, icon: "check-circle", color: "#6C63FF", key: "deliveries" },
    { label: "متوسط التوصيلة", value: `${avgPerDelivery.toFixed(2)} ₪`, icon: "trending-up", color: "#17A2B8", key: "avg" },
    { label: "التقييم", value: avgRating > 0 ? avgRating.toFixed(1) : "جديد", icon: "star", color: "#FFC107", key: "rating" },
  ];

  // إحصائيات الرصيد (من user)
  const commissionBalance = user?.commissionBalance || 0;
  const totalDeliveriesAll = user?.totalDeliveries || 0;
  const nextBonusDeliveries = 100 - (totalDeliveriesAll % 100);
  
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: "#28A745", paddingTop: topPad + 16 }]}>
          <Text style={styles.headerTitle}>💰 أرباحي ورصيدي</Text>
          <Text style={styles.headerSubtitle}>سجل أرباحك من التوصيلات</Text>
        </View>

        {/* إشعار قرب المكافأة */}
        {isNearBonus && (
          <View style={[styles.bonusAlert, { backgroundColor: "#FFF8E1", borderColor: "#FFC107" }]}>
            <Feather name="gift" size={22} color="#FF9800" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bonusAlertTitle, { color: "#E65100" }]}>🎁 قرب المكافأة!</Text>
              <Text style={[styles.bonusAlertText, { color: "#E65100" }]}>
                متبقي {deliveriesToNextBonus} توصيلة للحصول على {bonusAmount} ₪ مكافأة
              </Text>
            </View>
            <Feather name="chevron-left" size={16} color="#E65100" />
          </View>
        )}

        {/* بطاقات الإحصائيات */}
        <View style={styles.statsGrid}>
          {statsCards.map((stat) => (
            <View key={stat.key} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + "15" }]}>
                <Feather name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textGray }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* رصيد العمولة */}
        <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.balanceHeader}>
            <View style={[styles.balanceIcon, { backgroundColor: "#28A74515" }]}>
              <Feather name="credit-card" size={24} color="#28A745" />
            </View>
            <View>
              <Text style={[styles.balanceLabel, { color: colors.textGray }]}>رصيد العمولة الحالي</Text>
              <Text style={[styles.balanceValue, { color: "#28A745" }]}>{commissionBalance} ₪</Text>
            </View>
            <TouchableOpacity style={[styles.withdrawBtn, { borderColor: colors.border }]}>
              <Feather name="download" size={16} color={colors.primary} />
              <Text style={[styles.withdrawText, { color: colors.primary }]}>سحب</Text>
            </TouchableOpacity>
          </View>
          
          {/* شريط التقدم للمكافأة */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.textGray }]}>التقدم نحو المكافأة التالية</Text>
              <Text style={[styles.progressValue, { color: colors.primary }]}>{totalDeliveriesAll} / 100</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: `${totalDeliveriesAll % 100}%`, backgroundColor: "#28A745" }]} />
            </View>
            <Text style={[styles.progressHint, { color: colors.textLight }]}>
              🎁 عند إتمام 100 توصيلة، تحصل على {bonusAmount} ₪ مكافأة
            </Text>
          </View>
        </View>

        {/* فلتر الفترة */}
        <View style={styles.periodFilter}>
          <Text style={[styles.filterLabel, { color: colors.textGray }]}>الفترة:</Text>
          <View style={styles.filterButtons}>
            {periods.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor: selectedPeriod === p.key ? colors.primary : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedPeriod(p.key)}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    { color: selectedPeriod === p.key ? "#fff" : colors.textGray },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* قائمة التوصيلات */}
        <View style={styles.ordersSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📋 آخر التوصيلات</Text>
          
          {filteredOrders.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="package" size={48} color={colors.textLight} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد توصيلات</Text>
              <Text style={[styles.emptySub, { color: colors.textGray }]}>
                {selectedPeriod === "week" ? "لا توجد توصيلات هذا الأسبوع" :
                 selectedPeriod === "month" ? "لا توجد توصيلات هذا الشهر" :
                 selectedPeriod === "year" ? "لا توجد توصيلات هذه السنة" :
                 "لم تقم بأي توصيلة بعد"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredOrders.slice(0, 15)}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleOrderPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.orderCardLeft}>
                    <View style={[styles.orderIcon, { backgroundColor: "#28A74515" }]}>
                      <Feather name="check-circle" size={18} color="#28A745" />
                    </View>
                    <View>
                      <Text style={[styles.orderAddress, { color: colors.foreground }]} numberOfLines={1}>
                        {item.deliveryAddress}
                      </Text>
                      <Text style={[styles.orderDate, { color: colors.textGray }]}>
                        {new Date(item.createdAt).toLocaleDateString("ar-EG")}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.orderAmount, { color: "#28A745" }]}>+{item.finalPrice} ₪</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* Modal تفاصيل الطلب */}
      <Modal
        visible={showOrderDetail}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOrderDetail(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOrderDetail(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="info" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>تفاصيل التوصيلة</Text>
              <TouchableOpacity onPress={() => setShowOrderDetail(false)} style={styles.modalClose}>
                <Feather name="x" size={20} color={colors.textGray} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <>
                <View style={styles.modalContent}>
                  <View style={styles.detailRow}>
                    <Feather name="hash" size={14} color={colors.textGray} />
                    <Text style={[styles.detailLabel, { color: colors.textGray }]}>رقم الطلب:</Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedOrder.id}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Feather name="map-pin" size={14} color={colors.primary} />
                    <Text style={[styles.detailLabel, { color: colors.textGray }]}>الاستلام:</Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedOrder.pickupAddress}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Feather name="flag" size={14} color={colors.secondary} />
                    <Text style={[styles.detailLabel, { color: colors.textGray }]}>التسليم:</Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedOrder.deliveryAddress}</Text>
                  </View>
                  
                  {selectedOrder.packageDescription && (
                    <View style={styles.detailRow}>
                      <Feather name="package" size={14} color={colors.textGray} />
                      <Text style={[styles.detailLabel, { color: colors.textGray }]}>الطرد:</Text>
                      <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedOrder.packageDescription}</Text>
                    </View>
                  )}
                  
                  <View style={styles.detailRow}>
                    <Feather name="dollar-sign" size={14} color="#28A745" />
                    <Text style={[styles.detailLabel, { color: colors.textGray }]}>المبلغ:</Text>
                    <Text style={[styles.detailValue, { color: "#28A745", fontWeight: "700" }]}>{selectedOrder.finalPrice} ₪</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Feather name="calendar" size={14} color={colors.textGray} />
                    <Text style={[styles.detailLabel, { color: colors.textGray }]}>التاريخ:</Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{formatDate(selectedOrder.createdAt)}</Text>
                  </View>
                  
                  {selectedOrder.rating && (
                    <View style={styles.detailRow}>
                      <Feather name="star" size={14} color="#FFC107" />
                      <Text style={[styles.detailLabel, { color: colors.textGray }]}>التقييم:</Text>
                      <Text style={[styles.detailValue, { color: colors.foreground }]}>
                        {selectedOrder.rating} / 5
                        {selectedOrder.ratingComment && ` • ${selectedOrder.ratingComment}`}
                      </Text>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowOrderDetail(false)}
                >
                  <Text style={styles.modalButtonText}>إغلاق</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  
  // Header
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  headerSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 },
  
  // Bonus Alert
  bonusAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  bonusAlertTitle: { fontSize: 14, fontWeight: "700" },
  bonusAlertText: { fontSize: 12, marginTop: 2 },
  
  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 16,
  },
  statCard: {
    width: "47%",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11, textAlign: "center" },
  
  // Balance Card
  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  balanceIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  balanceLabel: { fontSize: 12 },
  balanceValue: { fontSize: 22, fontWeight: "800" },
  withdrawBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  withdrawText: { fontSize: 13, fontWeight: "600" },
  
  // Progress Section
  progressSection: { gap: 8 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { fontSize: 12 },
  progressValue: { fontSize: 13, fontWeight: "700" },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressHint: { fontSize: 11, marginTop: 4 },
  
  // Period Filter
  periodFilter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterLabel: { fontSize: 13, fontWeight: "600" },
  filterButtons: { flexDirection: "row", gap: 8 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterBtnText: { fontSize: 12, fontWeight: "600" },
  
  // Orders Section
  ordersSection: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  
  orderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  orderCardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  orderIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  orderAddress: { fontSize: 13, fontWeight: "600" },
  orderDate: { fontSize: 11, marginTop: 2 },
  orderAmount: { fontSize: 16, fontWeight: "800" },
  
  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySub: { fontSize: 13, textAlign: "center" },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "100%",
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: "700" },
  modalClose: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  modalContent: { gap: 12 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailLabel: { fontSize: 13, width: 55 },
  detailValue: { flex: 1, fontSize: 13 },
  modalButton: { paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 8 },
  modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});