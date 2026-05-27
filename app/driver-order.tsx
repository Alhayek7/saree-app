import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DRIVER_STEPS = [
  { key: "accepted",   label: "تم قبول الطلب",        icon: "check-circle" as const, color: "#6C63FF" },
  { key: "going",      label: "في الطريق للاستلام",   icon: "navigation" as const,   color: "#FF9800" },
  { key: "picked_up",  label: "تم استلام الطرد",      icon: "package" as const,      color: "#2196F3" },
  { key: "done",       label: "تم التسليم النهائي",   icon: "flag" as const,         color: "#28A745" },
];

const VEHICLE_EMOJI: Record<string, string> = { car: "🚗", bike: "🚲", truck: "🚛" };
const PAYMENT_LABEL: Record<string, string> = { cash: "💵 نقداً عند الاستلام", wallet: "👛 محفظة التطبيق" };

export default function DriverOrderScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { getOrderById, updateDriverStatus, cancelOrder } = useOrders();
  const { user, deductCommission, refundCommission } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);

  const order = getOrderById(orderId);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const progress = order?.driverProgress;
  const currentStepIdx = progress
    ? DRIVER_STEPS.findIndex((s) => s.key === progress)
    : 0;

  useEffect(() => {
    if (!order) return;
    if (order.status === "completed" || order.status === "cancelled") {
      router.replace("/(driver)" as any);
    }
  }, [order?.status]);

  if (!order) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={{ color: colors.textGray }}>الطلب غير موجود</Text>
          <TouchableOpacity onPress={() => router.replace("/(driver)" as any)} style={[styles.pill, { backgroundColor: "#28A745" }]}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>رجوع</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleNextStep = async () => {
    setActionLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 700));

    if (!progress) {
      const ok = deductCommission();
      if (!ok) {
        setActionLoading(false);
        Alert.alert("رصيد غير كافٍ", "يجب شحن رصيدك أولاً قبل البدء", [
          { text: "عرض الوكلاء", onPress: () => router.push("/(driver)/agents" as any) },
          { text: "إلغاء", style: "cancel" },
        ]);
        return;
      }
      updateDriverStatus(orderId, "going");
    } else if (progress === "going") {
      updateDriverStatus(orderId, "picked");
    } else if (progress === "picked_up") {
      updateDriverStatus(orderId, "driver_delivered");
    }

    setActionLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCancel = () => {
    Alert.alert("إلغاء الطلب", "هل أنت متأكد؟ إذا كنت قد بدأت الطلب سيُعاد رصيدك.", [
      { text: "لا", style: "cancel" },
      {
        text: "نعم، إلغاء",
        style: "destructive",
        onPress: () => {
          if (order.commissionDeducted) refundCommission();
          cancelOrder(orderId);
          router.replace("/(driver)" as any);
        },
      },
    ]);
  };

  const getActionLabel = () => {
    if (!progress) return "بدء رحلة الاستلام 🚀";
    if (progress === "going") return "تم استلام الطرد ✅";
    if (progress === "picked_up") return "تم التوصيل للعميل 🎉";
    return null;
  };

  const actionLabel = getActionLabel();
  const isDone = progress === "done" || order.status === "delivered";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: "#28A745", paddingTop: topPad > 20 ? 0 : 16 }]}>
        <TouchableOpacity onPress={() => router.replace("/(driver)" as any)}>
          <Feather name="arrow-right" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تنفيذ الطلب</Text>
        <View style={[styles.orderIdBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <Text style={styles.orderIdText}>#{order.id}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}>

        {/* Payment + commission reminder */}
        <View style={[styles.payCard, { backgroundColor: order.paymentMethod === "wallet" ? colors.primaryContainer : "#28A74512", borderColor: order.paymentMethod === "wallet" ? colors.primary + "40" : "#28A74540" }]}>
          <Text style={{ fontSize: 22 }}>{order.paymentMethod === "wallet" ? "👛" : "💵"}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.payTitle, { color: order.paymentMethod === "wallet" ? colors.primary : "#28A745" }]}>
              {PAYMENT_LABEL[order.paymentMethod]}
            </Text>
            <Text style={[styles.paySub, { color: colors.textGray }]}>
              {order.paymentMethod === "cash"
                ? "يدفع العميل لك نقداً عند الاستلام"
                : "سيُخصم من محفظة العميل تلقائياً"}
              {order.finalPrice ? ` • المبلغ: ${order.finalPrice} ₪` : ""}
            </Text>
          </View>
        </View>

        {/* Commission note */}
        {!order.commissionDeducted && (
          <View style={[styles.commCard, { backgroundColor: "#FFF3CD", borderColor: "#FFC10740" }]}>
            <Feather name="info" size={14} color="#856404" />
            <Text style={[styles.commText, { color: "#856404" }]}>
              سيُخصم 1 ₪ عمولة عند بدء الرحلة • رصيدك: {user?.commissionBalance ?? 0} ₪
            </Text>
          </View>
        )}
        {order.commissionDeducted && (
          <View style={[styles.commCard, { backgroundColor: "#E8F5E9", borderColor: "#28A74540" }]}>
            <Feather name="check" size={14} color="#28A745" />
            <Text style={[styles.commText, { color: "#28A745" }]}>
              تم خصم 1 ₪ عمولة • رصيدك: {user?.commissionBalance ?? 0} ₪
            </Text>
          </View>
        )}

        {/* Progress steps */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>مراحل التوصيل</Text>
          {DRIVER_STEPS.map((step, i) => {
            const done = i < currentStepIdx || isDone;
            const active = i === currentStepIdx && !isDone;
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepCircle, {
                    backgroundColor: done || active ? step.color : colors.muted,
                  }]}>
                    {done ? (
                      <Feather name="check" size={13} color="#fff" />
                    ) : (
                      <Feather name={step.icon} size={13} color={active ? "#fff" : colors.textLight} />
                    )}
                  </View>
                  {i < DRIVER_STEPS.length - 1 && (
                    <View style={[styles.stepLine, { backgroundColor: done ? step.color : colors.border }]} />
                  )}
                </View>
                <View style={{ flex: 1, paddingTop: 2 }}>
                  <Text style={[styles.stepLabel, {
                    color: done || active ? colors.foreground : colors.textLight,
                    fontWeight: active ? "700" : "400",
                  }]}>{step.label}</Text>
                </View>
                {active && (
                  <View style={[styles.activeBadge, { backgroundColor: step.color + "20" }]}>
                    <Text style={[styles.activeBadgeText, { color: step.color }]}>الآن</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Order details */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>تفاصيل الطلب</Text>
          <View style={styles.detailRow}>
            <View style={[styles.detailDot, { backgroundColor: "#28A745" }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: colors.textGray }]}>الاستلام من</Text>
              <Text style={[styles.detailVal, { color: colors.foreground }]}>{order.pickupAddress}</Text>
            </View>
          </View>
          <View style={[styles.connLine, { borderColor: colors.border }]} />
          <View style={styles.detailRow}>
            <View style={[styles.detailDot, { backgroundColor: "#FF6584" }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: colors.textGray }]}>التسليم إلى</Text>
              <Text style={[styles.detailVal, { color: colors.foreground }]}>{order.deliveryAddress}</Text>
            </View>
          </View>
          <View style={[styles.pkgRow, { backgroundColor: colors.muted }]}>
            <Text style={styles.pkgEmoji}>{VEHICLE_EMOJI[order.vehicleType]}</Text>
            <Text style={[styles.pkgText, { color: colors.textGray }]}>{order.packageDescription}</Text>
          </View>
        </View>

        {/* Done banner */}
        {isDone && (
          <View style={[styles.doneBanner, { backgroundColor: "#28A74512", borderColor: "#28A74540" }]}>
            <Text style={{ fontSize: 32 }}>🎉</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.doneTitle, { color: "#28A745" }]}>أحسنت! تم التوصيل بنجاح</Text>
              <Text style={[styles.doneSub, { color: colors.textGray }]}>في انتظار تأكيد العميل</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 16 : insets.bottom + 8 }]}>
        {!isDone && actionLabel && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: actionLoading ? colors.muted : "#28A745" }]}
            onPress={handleNextStep}
            disabled={actionLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>{actionLoading ? "جاري التحديث..." : actionLabel}</Text>
          </TouchableOpacity>
        )}
        {isDone && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(driver)" as any)}
            activeOpacity={0.85}
          >
            <Feather name="home" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>العودة للرئيسية</Text>
          </TouchableOpacity>
        )}
        {!isDone && order.status !== "delivered" && (
          <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.destructive }]} onPress={handleCancel}>
            <Text style={[styles.cancelBtnText, { color: colors.destructive }]}>إلغاء الطلب</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  headerTitle: { flex: 1, color: "#fff", fontSize: 17, fontWeight: "700", textAlign: "center" },
  orderIdBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  orderIdText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  pill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  payCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  payTitle: { fontSize: 15, fontWeight: "700" },
  paySub: { fontSize: 12, marginTop: 2 },
  commCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  commText: { fontSize: 12, flex: 1 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepLeft: { alignItems: "center", gap: 0 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  stepLine: { width: 2, height: 24, marginTop: 2 },
  stepLabel: { fontSize: 14, paddingTop: 6 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  activeBadgeText: { fontSize: 11, fontWeight: "700" },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  detailDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  detailLabel: { fontSize: 12 },
  detailVal: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  connLine: { height: 20, width: 1, borderWidth: 1, borderStyle: "dashed", marginLeft: 4, marginVertical: -4 },
  pkgRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, marginTop: 4 },
  pkgEmoji: { fontSize: 18 },
  pkgText: { fontSize: 13, flex: 1 },
  doneBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16, borderWidth: 1 },
  doneTitle: { fontSize: 16, fontWeight: "700" },
  doneSub: { fontSize: 12, marginTop: 3 },
  actionBar: { padding: 16, borderTopWidth: 1, gap: 10 },
  actionBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  actionBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelBtn: { borderRadius: 14, paddingVertical: 12, alignItems: "center", borderWidth: 1.5 },
  cancelBtnText: { fontSize: 14, fontWeight: "600" },
});
