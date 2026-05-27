import { useOrders, OrderStatus } from "@/context/OrdersContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STEPS: { key: OrderStatus; label: string; sub: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "searching", label: "إنشاء الطلب", sub: "تم إرسال طلبك للسائقين", icon: "check-circle" },
  { key: "accepted",  label: "قبول الطلب",  sub: "السائق في الطريق إليك", icon: "user-check" },
  { key: "picked",   label: "استلام الطرد", sub: "السائق استلم طردك وفي الطريق", icon: "package" },
  { key: "delivered", label: "التوصيل",     sub: "تم توصيل طردك", icon: "flag" },
];

const STATUS_ORDER: OrderStatus[] = ["searching", "bidding", "accepted", "picked", "delivered", "completed"];

const VEHICLE_LABELS: Record<string, string> = {
  car: "🚗 سيارة", bike: "🚲 باسكليت", truck: "🚛 سيارة نقل",
};

function PulsingDot({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: anim }] }}>
      <View style={[styles.pulseDot, { backgroundColor: color }]} />
    </Animated.View>
  );
}

export default function TrackOrderScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { getOrderById, cancelOrder, confirmDelivery, getUnreadCount } = useOrders();
  const { user } = useAuth();
  const [elapsed, setElapsed] = useState(0);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const order = getOrderById(orderId);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!order) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={48} color={colors.textLight} />
          <Text style={[styles.notFoundText, { color: colors.textGray }]}>الطلب غير موجود</Text>
          <TouchableOpacity onPress={() => router.replace("/(customer)/" as any)} style={[styles.pill, { backgroundColor: colors.primary }]}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>الرئيسية</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(order.status);
  const isActive = !["completed", "cancelled"].includes(order.status);
  const canCancel = order.status === "searching" || order.status === "bidding";
  const needsConfirm = order.status === "delivered";
  const isCompleted = order.status === "completed";
  const isBidding = order.status === "bidding";
  const canChat = order.status === "accepted" || order.status === "picked";
  const unreadCount = user && canChat ? getUnreadCount(orderId, user.id) : 0;

  const stepIdx = STEPS.findIndex((s) => {
    if (order.status === "searching" || order.status === "bidding") return s.key === "searching";
    if (order.status === "accepted") return s.key === "accepted";
    if (order.status === "picked") return s.key === "picked";
    if (order.status === "delivered" || order.status === "completed") return s.key === "delivered";
    return false;
  });

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleCancel = () => {
    Alert.alert("إلغاء الطلب", "هل أنت متأكد؟", [
      { text: "لا", style: "cancel" },
      { text: "نعم إلغاء", style: "destructive", onPress: () => { cancelOrder(orderId); router.replace("/(customer)/" as any); } },
    ]);
  };

  const handleConfirmDelivery = async () => {
    setConfirming(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise((r) => setTimeout(r, 800));
    confirmDelivery(orderId);
    router.push({ pathname: "/rate-driver", params: { orderId } });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: 35 }]}>

        <TouchableOpacity onPress={() => router.replace("/(customer)/" as any)}>
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>تتبع الطلب</Text>
        <View style={[styles.orderIdBadge, { backgroundColor: colors.primaryContainer }]}>
          <Text style={[styles.orderIdText, { color: colors.primary }]}>#{order.id}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Map placeholder */}
        <View style={[styles.mapBox, { backgroundColor: "#E8F4FD" }]}>
          <View style={styles.mapContent}>
            <View style={[styles.mapRoute, { borderColor: colors.primary }]} />
            <View style={[styles.mapPinA, { backgroundColor: colors.primary }]}>
              <Feather name="map-pin" size={14} color="#fff" />
            </View>
            <View style={[styles.mapPinB, { backgroundColor: colors.secondary }]}>
              <Feather name="flag" size={12} color="#fff" />
            </View>
            {(order.status === "accepted" || order.status === "picked") && (
              <View style={[styles.mapDriver, { backgroundColor: "#fff", borderColor: colors.primary }]}>
                <Text style={{ fontSize: 18 }}>
                  {order.vehicleType === "bike" ? "🚲" : order.vehicleType === "truck" ? "🚛" : "🚗"}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.mapOverlay}>
            {isActive && (
              <View style={[styles.etaBadge, { backgroundColor: "#fff" }]}>
                <PulsingDot color={colors.primary} />
                <Text style={[styles.etaLabel, { color: colors.foreground }]}>
                  {order.status === "searching" ? "يبحث عن سائق" :
                   order.status === "bidding" ? "عروض جاهزة" :
                   order.status === "accepted" ? `الوصول خلال ~${order.selectedOffer?.estimatedMinutes ?? 15} دقيقة` :
                   order.status === "picked" ? "الطرد في الطريق" : "تم التوصيل"}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ padding: 16, gap: 14 }}>

          {/* Bidding redirect */}
          {isBidding && (
            <TouchableOpacity
              style={[styles.biddingCard, { backgroundColor: "#6C63FF12", borderColor: "#6C63FF40" }]}
              onPress={() => router.push({ pathname: "/order-offers", params: { orderId } })}
            >
              <View style={[styles.biddingIconBox, { backgroundColor: "#6C63FF" }]}>
                <Feather name="tag" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.biddingTitle, { color: "#6C63FF" }]}>عروض السائقين جاهزة!</Text>
                <Text style={[styles.biddingSub, { color: colors.textGray }]}>اضغط لعرض العروض واختيار السائق</Text>
              </View>
              <Feather name="chevron-left" size={20} color="#6C63FF" />
            </TouchableOpacity>
          )}

          {/* Completed banner */}
          {isCompleted && (
            <View style={[styles.completedBanner, { backgroundColor: "#28A74512", borderColor: "#28A74540" }]}>
              <Text style={{ fontSize: 30 }}>🎉</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.completedTitle, { color: "#28A745" }]}>تم التوصيل بنجاح!</Text>
                <Text style={[styles.completedSub, { color: colors.textGray }]}>
                  تم توصيل طردك بنجاح{order.finalPrice ? ` — دفعت ${order.finalPrice} ₪` : ""}
                </Text>
              </View>
            </View>
          )}

          {/* Driver card - FIRST (يأتي أولاً) */}
          {order.selectedOffer && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>السائق</Text>
              <View style={styles.driverRow}>
                <View style={[styles.driverAvatar, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[styles.driverAvatarText, { color: colors.primary }]}>
                    {order.selectedOffer.driverName.charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.driverName, { color: colors.foreground }]}>{order.selectedOffer.driverName}</Text>
                  <View style={styles.driverMeta}>
                    <Feather name="star" size={12} color="#FFC107" />
                    <Text style={[styles.driverRating, { color: colors.textGray }]}>{order.selectedOffer.driverRating}</Text>
                    <Text style={[styles.driverDeliv, { color: colors.textLight }]}>({order.selectedOffer.totalDeliveries} توصيلة)</Text>
                  </View>
                  <Text style={[styles.driverVehicle, { color: colors.textGray }]}>{VEHICLE_LABELS[order.selectedOffer.vehicleType]}</Text>
                  
                  {/* الوقت المتوقع للوصول */}
                  <View style={[styles.etaContainer, { borderTopColor: colors.border }]}>
                    <Feather name="clock" size={14} color={colors.primary} />
                    <Text style={[styles.etaText, { color: colors.foreground }]}>
                      الوقت المتوقع: {order.selectedOffer.estimatedMinutes} دقيقة
                    </Text>
                  </View>
                </View>
                <View style={styles.driverActions}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#28A745" }]}>
                    <Feather name="phone" size={16} color="#fff" />
                  </TouchableOpacity>
                  {canChat && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                      onPress={() => router.push({ pathname: "/chat", params: { orderId } })}
                      activeOpacity={0.85}
                    >
                      <Feather name="message-circle" size={16} color="#fff" />
                      {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {order.finalPrice && (
                <View style={[styles.priceRow, { backgroundColor: colors.muted }]}>
                  <Text style={{ fontSize: 16 }}>💵</Text>
                  <Text style={[styles.priceLabel, { color: colors.textGray }]}>المبلغ المستحق للدفع (نقداً)</Text>
                  <Text style={[styles.priceVal, { color: "#28A745" }]}>
                    {order.finalPrice} ₪
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Progress steps - SECOND (يأتي ثانياً) */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>حالة الطلب</Text>
            {STEPS.map((step, i) => {
              const done = i < stepIdx || isCompleted;
              const active = i === stepIdx && !isCompleted;
              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View style={[
                      styles.stepCircle,
                      { backgroundColor: done || active ? colors.primary : colors.muted, borderColor: active ? colors.primary : "transparent" },
                    ]}>
                      {done ? (
                        <Feather name="check" size={13} color="#fff" />
                      ) : active ? (
                        <PulsingDot color="#fff" />
                      ) : (
                        <Feather name={step.icon} size={13} color={colors.textLight} />
                      )}
                    </View>
                    {i < STEPS.length - 1 && (
                      <View style={[styles.stepLine, { backgroundColor: done ? colors.primary : colors.border }]} />
                    )}
                  </View>
                  <View style={{ flex: 1, paddingTop: 2 }}>
                    <Text style={[styles.stepLabel, { color: done || active ? colors.foreground : colors.textLight, fontWeight: active ? "700" : "400" }]}>
                      {step.label}
                    </Text>
                    {active && <Text style={[styles.stepSub, { color: colors.textGray }]}>{step.sub}</Text>}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Route details */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>تفاصيل الرحلة</Text>
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.routeTypeLabel, { color: colors.textGray }]}>الاستلام من</Text>
                <Text style={[styles.routeAddr, { color: colors.foreground }]}>{order.pickupAddress}</Text>
              </View>
            </View>
            <View style={[styles.routeConnLine, { borderColor: colors.border }]} />
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, { backgroundColor: colors.secondary }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.routeTypeLabel, { color: colors.textGray }]}>التسليم إلى</Text>
                <Text style={[styles.routeAddr, { color: colors.foreground }]}>{order.deliveryAddress}</Text>
              </View>
            </View>
            <View style={[styles.pkgRow, { borderTopColor: colors.border }]}>
              <Feather name="package" size={14} color={colors.textGray} />
              <Text style={[styles.pkgText, { color: colors.textGray }]}>{order.packageDescription}</Text>
            </View>
          </View>

          {/* Timer (active only) */}
          {isActive && !isBidding && (
            <View style={[styles.timerCard, { backgroundColor: colors.muted }]}>
              <Feather name="clock" size={16} color={colors.textGray} />
              <Text style={[styles.timerText, { color: colors.textGray }]}>وقت انتظار: {formatTime(elapsed)}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom actions */}
      {(canCancel || needsConfirm) && (
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 16 : insets.bottom + 8 }]}>
          {needsConfirm ? (
            <View style={{ gap: 10 }}>
              <View style={[styles.payReminder, { backgroundColor: "#FFF3E0", borderColor: "#FFA63D40" }]}>
                <Text style={{ fontSize: 18 }}>💵</Text>
                <Text style={[styles.payReminderText, { color: "#E65100" }]}>
                  تذكّر دفع {order.finalPrice ?? "..."} ₪ نقداً للسائق عند الاستلام
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: confirming ? colors.muted : "#28A745" }]}
                onPress={handleConfirmDelivery}
                disabled={confirming}
                activeOpacity={0.85}
              >
                <Feather name="check-circle" size={22} color={confirming ? colors.textLight : "#fff"} />
                <Text style={[styles.confirmBtnText, { color: confirming ? colors.textLight : "#fff" }]}>
                  {confirming ? "جاري التأكيد..." : "تأكيد استلام الطرد"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: "#FFEBEE", borderColor: colors.destructive }]}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Feather name="x-circle" size={18} color={colors.destructive} />
              <Text style={[styles.cancelBtnText, { color: colors.destructive }]}>إلغاء الطلب</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 30, borderBottomWidth: 1, gap: 12 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", textAlign: "center" },
  orderIdBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  orderIdText: { fontSize: 12, fontWeight: "700" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  notFoundText: { fontSize: 16 },
  pill: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  mapBox: { height: 200, position: "relative", overflow: "hidden" },
  mapContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  mapRoute: { position: "absolute", width: 180, height: 60, borderWidth: 2, borderStyle: "dashed", borderRadius: 30 },
  mapPinA: { position: "absolute", left: "20%", top: "30%", width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  mapPinB: { position: "absolute", right: "20%", bottom: "30%", width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  mapDriver: { position: "absolute", borderWidth: 2, borderRadius: 20, padding: 4 },
  mapOverlay: { position: "absolute", bottom: 12, left: 12, right: 12, alignItems: "center" },
  etaBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  etaLabel: { fontSize: 13, fontWeight: "600" },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  biddingCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1.5 },
  biddingIconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  biddingTitle: { fontSize: 15, fontWeight: "700" },
  biddingSub: { fontSize: 12, marginTop: 2 },
  completedBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  completedTitle: { fontSize: 16, fontWeight: "700" },
  completedSub: { fontSize: 13, marginTop: 2 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  stepRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  stepLeft: { alignItems: "center", width: 28 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  stepLine: { width: 2, height: 28, marginTop: 4 },
  stepLabel: { fontSize: 14 },
  stepSub: { fontSize: 12, marginTop: 2 },
  driverRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  driverAvatar: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  driverAvatarText: { fontSize: 22, fontWeight: "800" },
  driverName: { fontSize: 15, fontWeight: "700" },
  driverMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  driverRating: { fontSize: 12, fontWeight: "600" },
  driverDeliv: { fontSize: 11 },
  driverVehicle: { fontSize: 12, marginTop: 2 },
  driverActions: { flexDirection: "row", gap: 8 },
  actionBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  unreadBadge: { position: "absolute", top: -4, right: -4, backgroundColor: "#FF6584", borderRadius: 8, minWidth: 16, height: 16, justifyContent: "center", alignItems: "center", paddingHorizontal: 3 },
  unreadText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 12 },
  priceLabel: { flex: 1, fontSize: 13 },
  priceVal: { fontSize: 16, fontWeight: "800" },
  routeItem: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  routeDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  routeTypeLabel: { fontSize: 11 },
  routeAddr: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  routeConnLine: { height: 16, width: 1, borderLeftWidth: 1, borderStyle: "dashed", marginLeft: 5, marginVertical: 2 },
  pkgRow: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, paddingTop: 12 },
  pkgText: { fontSize: 13, flex: 1 },
  timerCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10 },
  timerText: { fontSize: 13 },
  bottomBar: { padding: 16, borderTopWidth: 1, gap: 10 },
  payReminder: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  payReminderText: { flex: 1, fontSize: 13, fontWeight: "600" },
  confirmBtn: { borderRadius: 14, paddingVertical: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  confirmBtnText: { fontSize: 17, fontWeight: "700" },
  cancelBtn: { borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5 },
  cancelBtnText: { fontSize: 15, fontWeight: "700" },
  etaContainer: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  marginTop: 8,
  paddingTop: 6,
  borderTopWidth: 1,

},
etaText: {
  fontSize: 13,
  fontWeight: "600",
},

});
