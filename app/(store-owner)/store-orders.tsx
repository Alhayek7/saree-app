// app/(store-owner)/store-orders.tsx
import { useAuth } from "@/context/AuthContext";
import { useStoreOrder, StoreOrder } from "@/context/StoreOrderContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
    Image,
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

// تكوينات الحالات المختلفة للطلبات
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: keyof typeof Feather.glyphMap }> = {
  pending_payment: { label: "بانتظار الدفع", color: "#FFA63D", icon: "clock" },
  payment_review: { label: "مراجعة الدفع", color: "#6C63FF", icon: "eye" },
  accepted: { label: "مقبول", color: "#28A745", icon: "check-circle" },
  rejected: { label: "مرفوض", color: "#DC3545", icon: "x-circle" },
  delivered: { label: "تم التوصيل", color: "#17A2B8", icon: "truck" },
};

// تعريف نوع الأيقونات المستخدمة في الفلاتر
type FilterIconName = 
  | "align-justify"
  | "clock" 
  | "eye" 
  | "check-circle" 
  | "x-circle";

// مصفوفة الفلاتر
const filters: { key: string; label: string; icon: FilterIconName }[] = [
  { key: "all", label: "الكل", icon: "align-justify" },
  { key: "pending_payment", label: "بانتظار الدفع", icon: "clock" },
  { key: "payment_review", label: "مراجعة الدفع", icon: "eye" },
  { key: "accepted", label: "مقبول", icon: "check-circle" },
  { key: "rejected", label: "مرفوض", icon: "x-circle" },
];

export default function StoreOrdersScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getStoreOrders, updateOrderStatus } = useStoreOrder();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
const [selectedImage, setSelectedImage] = useState<string | null>(null);
const [imageModalVisible, setImageModalVisible] = useState(false);
// عرض صورة إثبات الدفع
const viewPaymentProof = (imageUri: string) => {
  setSelectedImage(imageUri);
  setImageModalVisible(true);
};
  const storeOrders = getStoreOrders(user?.id || "");
  
  const filteredOrders = storeOrders.filter(order => {
    if (filter === "all") return true;
    return order.status === filter;
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

const handleAcceptOrder = (order: StoreOrder) => {
  console.log("الطلب المرسل:", order.id); // للتأكد من وجود المعرف
  router.push({ 
    pathname: "/(store-owner)/assign-driver", 
    params: { orderId: order.id } 
  });
};

  const handleConfirmAccept = () => {
    if (selectedOrder) {
      updateOrderStatus(selectedOrder.id, "accepted");
      setModalVisible(false);
      setSelectedOrder(null);
    }
  };

  const handleRejectOrder = (order: StoreOrder) => {
    Alert.alert(
      "رفض الطلب",
      "هل أنت متأكد من رفض هذا الطلب؟",
      [
        { text: "إلغاء", style: "cancel" },
        { 
          text: "رفض", 
          style: "destructive",
          onPress: () => updateOrderStatus(order.id, "rejected", { reason: "لم يتم استلام المبلغ" })
        }
      ]
    );
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending_payment;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ar-EG");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#FF6584", paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>طلبات الشراء</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs - مع تمرير أفقي */}
      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContainer}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f.key ? "#FF6584" : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Feather 
                name={f.icon} 
                size={14} 
                color={filter === f.key ? "#fff" : colors.textGray} 
              />
              <Text 
                style={[
                  styles.filterText, 
                  { color: filter === f.key ? "#fff" : colors.textGray }
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* قائمة الطلبات */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.primary]} 
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color={colors.textLight} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              لا توجد طلبات
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textGray }]}>
              سيظهر هنا الطلبات الواردة من العملاء
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = getStatusConfig(item.status);
          const isPendingReview = item.status === "payment_review";
          
          return (
            <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* رأس البطاقة */}
              <View style={styles.orderHeader}>
                <Text style={[styles.orderId, { color: colors.primary }]}>
                  #{item.id.slice(-8)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: status.color + "15" }]}>
                  <Feather name={status.icon} size={10} color={status.color} />
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              </View>

              {/* معلومات العميل */}
              <Text style={[styles.customerName, { color: colors.foreground }]}>
                {item.customerName}
              </Text>
              <Text style={[styles.customerPhone, { color: colors.textGray }]}>
                {item.customerPhone}
              </Text>
              
              {/* عنوان التوصيل */}
              <View style={styles.addressBox}>
                <Feather name="map-pin" size={12} color={colors.textGray} />
                <Text style={[styles.addressText, { color: colors.textGray }]} numberOfLines={2}>
                  {item.deliveryAddress}
                </Text>
              </View>

              {/* قائمة المنتجات */}
              <View style={styles.itemsPreview}>
                <Text style={[styles.itemsTitle, { color: colors.textGray }]}>
                  المنتجات:
                </Text>
                {item.items.slice(0, 2).map((product, idx) => (
                  <Text key={idx} style={[styles.itemText, { color: colors.textGray }]}>
                    • {product.name} x{product.quantity}
                  </Text>
                ))}
                {item.items.length > 2 && (
                  <Text style={[styles.moreText, { color: colors.textLight }]}>
                    +{item.items.length - 2} منتجات أخرى
                  </Text>
                )}
              </View>

              {/* المبلغ والتاريخ */}
              <View style={styles.orderFooter}>
                <Text style={[styles.totalPrice, { color: colors.primary }]}>
                  {item.totalPrice} ₪
                </Text>
                <Text style={[styles.orderDate, { color: colors.textLight }]}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>

              {/* إثبات الدفع */}
{item.paymentProof && (
  <TouchableOpacity 
    style={styles.paymentProofBox}
    onPress={() => viewPaymentProof(item.paymentProof!.imageUri)}
    activeOpacity={0.7}
  >
    <Feather name="image" size={14} color={colors.primary} />
    <Text style={[styles.proofText, { color: colors.primary }]}>📎 تم رفع إثبات الدفع - اضغط للمعاينة</Text>
    <Feather name="chevron-left" size={14} color={colors.primary} />
  </TouchableOpacity>
)}

              {/* أزرار الإجراءات */}
              {isPendingReview && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.acceptBtn, { backgroundColor: colors.secondary }]}
                    onPress={() => handleAcceptOrder(item)}
                  >
                    <Feather name="check" size={16} color="#fff" />
                    <Text style={styles.acceptBtnText}>قبول الطلب</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectBtn, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive }]}
                    onPress={() => handleRejectOrder(item)}
                  >
                    <Feather name="x" size={16} color={colors.destructive} />
                    <Text style={[styles.rejectBtnText, { color: colors.destructive }]}>رفض</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

{/* مودال عرض صورة إثبات الدفع */}
<Modal
  visible={imageModalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setImageModalVisible(false)}
>
  <View style={styles.imageModalOverlay}>
    <View style={[styles.imageModalContainer, { backgroundColor: colors.card }]}>
      <View style={styles.imageModalHeader}>
        <Text style={[styles.imageModalTitle, { color: colors.foreground }]}>إثبات الدفع</Text>
        <TouchableOpacity onPress={() => setImageModalVisible(false)}>
          <Feather name="x" size={24} color={colors.textGray} />
        </TouchableOpacity>
      </View>
      
      {selectedImage && (
        <>
          <Image 
            source={{ uri: selectedImage }} 
            style={styles.paymentFullImage}
            resizeMode="contain"
          />
          <View style={styles.imageModalButtons}>
            <TouchableOpacity
              style={[styles.imageCloseBtn, { backgroundColor: colors.muted }]}
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={{ color: colors.textGray }}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  </View>
</Modal>

      {/* مودال تأكيد القبول */}
      <Modal 
        visible={modalVisible} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                قبول الطلب
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color={colors.textGray} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalText, { color: colors.textGray }]}>
              هل أنت متأكد من قبول هذا الطلب؟
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: colors.muted }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: colors.textGray }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.secondary }]}
                onPress={handleConfirmAccept}
              >
                <Text style={{ color: "#fff" }}>تأكيد القبول</Text>
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
  
  // Header styles
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 16, 
    paddingBottom: 16 
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  
  // Filter styles
  filterWrapper: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  filtersScroll: { 
    flexGrow: 0,
  },
  filtersContainer: { 
    flexDirection: "row", 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    gap: 10,
    alignItems: "center",
  },
  filterChip: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    borderWidth: 1 
  },
  filterText: { fontSize: 13, fontWeight: "600" },
  
  // List styles
  listContainer: { 
    padding: 16, 
    gap: 12 
  },
  
  // Empty state styles
  emptyContainer: { 
    alignItems: "center", 
    justifyContent: "center", 
    paddingVertical: 60, 
    gap: 12 
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
  
  // Order card styles
  orderCard: { 
    borderRadius: 14, 
    borderWidth: 1, 
    padding: 14, 
    gap: 8 
  },
  orderHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  orderId: { fontSize: 13, fontWeight: "700" },
  statusBadge: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4, 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 10 
  },
  statusText: { fontSize: 10, fontWeight: "600" },
  customerName: { fontSize: 15, fontWeight: "700" },
  customerPhone: { fontSize: 12 },
  addressBox: { flexDirection: "row", alignItems: "center", gap: 6 },
  addressText: { fontSize: 12, flex: 1 },
  itemsPreview: { gap: 2, marginTop: 4 },
  itemsTitle: { fontSize: 12, fontWeight: "600" },
  itemText: { fontSize: 11 },
  moreText: { fontSize: 10 },
  orderFooter: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginTop: 8 
  },
  totalPrice: { fontSize: 16, fontWeight: "800" },
  orderDate: { fontSize: 11 },
  paymentProofBox: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    marginTop: 4 
  },
  proofText: { fontSize: 11, fontWeight: "600" },
  
  // Action buttons styles
  actionButtons: { 
    flexDirection: "row", 
    gap: 12, 
    marginTop: 8 
  },
  acceptBtn: { 
    flex: 2, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 6, 
    paddingVertical: 10, 
    borderRadius: 10 
  },
  acceptBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  rejectBtn: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 6, 
    paddingVertical: 10, 
    borderRadius: 10, 
    borderWidth: 1 
  },
  rejectBtnText: { fontSize: 13, fontWeight: "600" },
  
  // Modal styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "center", 
    alignItems: "center", 
    paddingHorizontal: 20 
  },
  modalContainer: { 
    width: "100%", 
    borderRadius: 20, 
    padding: 20, 
    gap: 16 
  },
  modalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalCancelBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: "center" 
  },
  modalConfirmBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: "center" 
  },

imageModalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.9)",
  justifyContent: "center",
  alignItems: "center",
},
imageModalContainer: {
  width: "90%",
  maxHeight: "80%",
  borderRadius: 16,
  overflow: "hidden",
},
imageModalHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: "#E5E5E5",
},
imageModalTitle: {
  fontSize: 16,
  fontWeight: "700",
},
paymentFullImage: {
  width: "100%",
  height: 400,
  backgroundColor: "#000",
},
imageModalButtons: {
  flexDirection: "row",
  gap: 12,
  padding: 16,
  borderTopWidth: 1,
  borderTopColor: "#E5E5E5",
},
imageCloseBtn: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 10,
  alignItems: "center",
},
});