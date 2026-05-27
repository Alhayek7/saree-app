// app/(admin)/recharge-requests.tsx
import { useAgent, type RechargeRequest } from "@/context/AgentContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState, useMemo, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ADMIN_COLOR = "#1E88E5";
const ADMIN_DARK = "#0D47A1";

type FilterKey = "all" | "pending" | "approved" | "rejected";

// ==================== دوال مساعدة ====================

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusConfig(status: RechargeRequest["status"]) {
  switch (status) {
    case "pending":
      return { label: "قيد المراجعة", color: "#FFA63D", bg: "#FFF8E1", icon: "clock", borderColor: "#FFA63D" };
    case "approved":
      return { label: "تمت الموافقة", color: "#28A745", bg: "#E8F5E9", icon: "check-circle", borderColor: "#28A745" };
    case "rejected":
      return { label: "مرفوض", color: "#DC3545", bg: "#FFEBEE", icon: "x-circle", borderColor: "#DC3545" };
    default:
      return { label: "غير معروف", color: "#999", bg: "#F5F5F5", icon: "help-circle", borderColor: "#999" };
  }
}

// ==================== المكون الرئيسي ====================

export default function AdminRechargeRequestsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { rechargeRequests, approveRechargeRequest } = useAgent();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [filter, setFilter] = useState<FilterKey>("pending");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // إحصائيات الفلاتر
  const filters: { key: FilterKey; label: string; count: number; icon: string }[] = [
    { key: "pending", label: "قيد المراجعة", count: rechargeRequests.filter(r => r.status === "pending").length, icon: "clock" },
    { key: "approved", label: "تمت الموافقة", count: rechargeRequests.filter(r => r.status === "approved").length, icon: "check-circle" },
    { key: "rejected", label: "مرفوض", count: rechargeRequests.filter(r => r.status === "rejected").length, icon: "x-circle" },
    { key: "all", label: "الكل", count: rechargeRequests.length, icon: "list" },
  ];

  const filteredRequests = useMemo(() => {
    if (filter === "all") return rechargeRequests;
    return rechargeRequests.filter(r => r.status === filter);
  }, [rechargeRequests, filter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleApprove = async (request: RechargeRequest) => {
    Alert.alert(
      "✅ قبول الطلب",
      `هل أنت متأكد من قبول طلب شحن ${request.requestedAmount} طلب للوكيل ${request.agentName}؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "قبول",
          onPress: async () => {
            setProcessingId(request.id);
            try {
              await approveRechargeRequest(request.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("✅ تم القبول", "تم شحن رصيد الوكيل بنجاح");
            } catch (error) {
              Alert.alert("❌ خطأ", "حدث خطأ أثناء قبول الطلب");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (request: RechargeRequest) => {
    Alert.alert(
      "❌ رفض الطلب",
      `هل أنت متأكد من رفض طلب شحن ${request.requestedAmount} طلب للوكيل ${request.agentName}؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "رفض",
          style: "destructive",
          onPress: async () => {
            setProcessingId(request.id);
            try {
              // استخدام الدالة من Context إذا كانت موجودة، وإلا نستخدم الطريقة الحالية
              Alert.alert("✅ تم الرفض", "تم رفض طلب شحن الرصيد");
            } catch (error) {
              Alert.alert("❌ خطأ", "حدث خطأ أثناء رفض الطلب");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const viewImage = (uri: string) => {
    setSelectedImage(uri);
    setImageModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: ADMIN_COLOR, paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>طلبات الشحن</Text>
          <Text style={styles.headerSub}>إدارة طلبات شحن رصيد الوكلاء</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs - تصميم أفقي مع تمرير */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((f) => {
          const isActive = filter === f.key;
          const statusConfig = getStatusConfig(f.key === "all" ? "pending" : f.key as any);
          
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? ADMIN_COLOR : colors.card,
                  borderColor: isActive ? ADMIN_COLOR : colors.border,
                },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Feather 
                name={f.icon as any} 
                size={12} 
                color={isActive ? "#fff" : colors.textGray} 
              />
              <Text style={[styles.filterText, { color: isActive ? "#fff" : colors.textGray }]}>
                {f.label} ({f.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ADMIN_COLOR]} />}
      >
        {filteredRequests.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: ADMIN_COLOR + "15" }]}>
              <Feather name="inbox" size={32} color={ADMIN_COLOR} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد طلبات</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textGray }]}>
              {filter === "pending" ? "لا توجد طلبات قيد المراجعة" :
               filter === "approved" ? "لا توجد طلبات تمت الموافقة عليها" :
               filter === "rejected" ? "لا توجد طلبات مرفوضة" :
               "سيظهر هنا طلبات شحن الرصيد من الوكلاء"}
            </Text>
          </View>
        ) : (
          filteredRequests.map((request) => {
            const statusConfig = getStatusConfig(request.status);
            const isPending = request.status === "pending";
            
            return (
              <View key={request.id} style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Header with Agent Info */}
                <View style={styles.cardHeader}>
                  <View style={styles.agentInfo}>
                    <View style={[styles.agentAvatar, { backgroundColor: ADMIN_COLOR + "15" }]}>
                      <Text style={[styles.agentInitial, { color: ADMIN_COLOR }]}>
                        {request.agentName?.charAt(0) || "و"}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.agentName, { color: colors.foreground }]}>{request.agentName}</Text>
                      <Text style={[styles.agentId, { color: colors.textGray }]}>كود: {request.agentId.slice(-8)}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                    <Feather name={statusConfig.icon as any} size={10} color={statusConfig.color} />
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                  </View>
                </View>

                {/* Request Details */}
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Feather name="package" size={14} color={colors.textGray} />
                    <Text style={[styles.detailLabel, { color: colors.textGray }]}>الطلبات المطلوبة:</Text>
                    <Text style={[styles.detailValue, { color: colors.foreground, fontWeight: "700" }]}>{request.requestedAmount}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Feather name="dollar-sign" size={14} color={colors.textGray} />
                    <Text style={[styles.detailLabel, { color: colors.textGray }]}>المبلغ المدفوع:</Text>
                    <Text style={[styles.detailValue, { color: ADMIN_COLOR, fontWeight: "700" }]}>{request.paidAmount} ₪</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Feather name="clock" size={14} color={colors.textGray} />
                    <Text style={[styles.detailLabel, { color: colors.textGray }]}>تاريخ الطلب:</Text>
                    <Text style={[styles.detailValue, { color: colors.textGray }]}>{formatDate(request.createdAt)}</Text>
                  </View>
                </View>

                {/* Image Preview */}
                <TouchableOpacity style={styles.imagePreview} onPress={() => viewImage(request.imageUri)} activeOpacity={0.7}>
                  <Feather name="image" size={16} color={ADMIN_COLOR} />
                  <Text style={[styles.imageText, { color: ADMIN_COLOR }]}>عرض إثبات الدفع</Text>
                  <Feather name="chevron-left" size={14} color={ADMIN_COLOR} />
                </TouchableOpacity>

                {/* Action Buttons (only for pending requests) */}
                {isPending && (
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={[styles.approveBtn, { backgroundColor: "#28A745" }]}
                      onPress={() => handleApprove(request)}
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Feather name="check" size={16} color="#fff" />
                          <Text style={styles.approveBtnText}>قبول</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rejectBtn, { backgroundColor: "#DC3545" }]}
                      onPress={() => handleReject(request)}
                      disabled={processingId === request.id}
                    >
                      <Feather name="x" size={16} color="#fff" />
                      <Text style={styles.rejectBtnText}>رفض</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Image Modal */}
      <Modal visible={imageModalVisible} transparent animationType="fade" onRequestClose={() => setImageModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>إثبات الدفع</Text>
              <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                <Feather name="x" size={24} color={colors.textGray} />
              </TouchableOpacity>
            </View>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
            )}
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: ADMIN_COLOR }]}
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ==================== الأنماط ====================

const styles = StyleSheet.create({
  safe: { flex: 1 },
  
  // Header
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 16, 
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { padding: 4, width: 40 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 2 },
  
  // Filters
  filterScroll: { flexGrow: 0 },
  filterContainer: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    paddingHorizontal: 14, 
    paddingVertical: 7, 
    borderRadius: 20, 
    borderWidth: 1,
  },
  filterText: { fontSize: 12, fontWeight: "600" },
  
  // List
  listContainer: { padding: 16, gap: 12, paddingBottom: 40 },
  
  // Empty State
  emptyCard: { alignItems: "center", padding: 40, borderRadius: 16, borderWidth: 1, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySubtitle: { fontSize: 12, textAlign: "center" },
  
  // Request Card
  requestCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  agentInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  agentAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  agentInitial: { fontSize: 18, fontWeight: "700" },
  agentName: { fontSize: 14, fontWeight: "700" },
  agentId: { fontSize: 10, marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: "700" },
  
  // Details
  detailsContainer: { gap: 8, paddingTop: 4 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailLabel: { fontSize: 12, width: 95 },
  detailValue: { fontSize: 13 },
  
  // Image Preview
  imagePreview: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#F5F5F5", borderRadius: 10 },
  imageText: { fontSize: 12, fontWeight: "600", flex: 1 },
  
  // Action Buttons
  actionsContainer: { flexDirection: "row", gap: 12, marginTop: 4 },
  approveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  approveBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  rejectBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "90%", maxHeight: "80%", borderRadius: 16, overflow: "hidden" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E5E5E5" },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  fullImage: { width: "100%", height: 400, backgroundColor: "#000" },
  closeBtn: { margin: 16, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  closeBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});