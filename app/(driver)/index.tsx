// app/(driver)/index.tsx
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// مراحل التوصيل
const DELIVERY_STAGES = [
  { status: "accepted", label: "قيد الانتظار", nextAction: "تأكيد الذهاب للاستلام", nextStatus: "going", icon: "clock" as const, color: "#FFA63D" },
  { status: "going", label: "في الطريق للاستلام", nextAction: "تأكيد استلام الطرد", nextStatus: "picked", icon: "navigation" as const, color: "#FFA63D" },
  { status: "picked", label: "تم استلام الطرد", nextAction: "تأكيد التوصيل", nextStatus: "delivered", icon: "package" as const, color: "#6C63FF" },
  { status: "delivered", label: "بانتظار تأكيد العميل", nextAction: null, nextStatus: null, icon: "check-circle" as const, color: "#17A2B8" },
  { status: "completed", label: "تم التسليم بنجاح ✓", nextAction: null, nextStatus: null, icon: "check-circle" as const, color: "#28A745" },
];

function getStageConfig(status: string) {
  if (status === "accepted") return DELIVERY_STAGES[0];
  if (status === "going") return DELIVERY_STAGES[1];
  if (status === "picked") return DELIVERY_STAGES[2];
  if (status === "delivered") return DELIVERY_STAGES[3];
  if (status === "completed") return DELIVERY_STAGES[4];
  return DELIVERY_STAGES[0];
}

// Toast Banner
function Toast({ msg, type, onDone }: { msg: string; type: "success" | "error"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={[toastStyles.wrap, { backgroundColor: type === "success" ? "#28A745" : "#EF5350" }]}>
      <Feather name={type === "success" ? "check-circle" : "alert-circle"} size={16} color="#fff" />
      <Text style={toastStyles.text}>{msg}</Text>
    </View>
  );
}

const toastStyles = StyleSheet.create({
  wrap: { position: "absolute", top: Platform.OS === "web" ? 80 : 100, left: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14, zIndex: 999, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  text: { color: "#fff", fontSize: 14, fontWeight: "700", flex: 1 },
});

export default function DriverHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { 
    orders, 
    getDriverActiveOrder, 
    getSearchingOrders, 
    getMyOrders, 
    updateDriverStatus,
    submitDriverBid 
  } = useOrders();
  
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<"available" | "active">("available");
  // حالة محلية لتتبع الطلبات التي قدم لها السائق عرضاً
  const [submittedOrders, setSubmittedOrders] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // Offer modal
  const [offerModal, setOfferModal] = useState<{ orderId: string; pickupAddress: string; deliveryAddress: string; vehicleType: string } | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMinutes, setOfferMinutes] = useState("");
  const [offerError, setOfferError] = useState("");

  // Stage confirm modal
  const [stageConfirm, setStageConfirm] = useState<{ orderId: string; currentStatus: string; nextStatus: string; nextLabel: string; nextColor: string } | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ msg, type });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const driverId = user?.id || "";

  // بيانات حية من Context
  const availableOrders = getSearchingOrders();
  const activeOrder = getDriverActiveOrder(driverId);
  const myOrders = getMyOrders(driverId);
  const myActiveOrders = myOrders.filter(o => ["accepted", "going", "picked", "delivered"].includes(o.status));
  
  const completedCount = myOrders.filter(o => o.status === "completed").length;
  const avgRating = myOrders.filter(o => o.rating).reduce((sum, o) => sum + (o.rating || 0), 0) / (myOrders.filter(o => o.rating).length || 1);
const onRefresh = () => {
  setRefreshing(true);
  setSubmittedOrders(new Set());
  setTimeout(() => setRefreshing(false), 1000);
};


  // تقديم عرض
const handleSubmitOffer = () => {
  if (!driverId) {
    setOfferError("يجب تفعيل حسابك من الإدارة أولاً");
    return;
  }
  const price = parseInt(offerPrice, 10);
  const minutes = parseInt(offerMinutes, 10);
  if (isNaN(price) || price < 3) { 
    setOfferError("أدخل سعراً صحيحاً (3 شيكل على الأقل)"); 
    return; 
  }
  if (isNaN(minutes) || minutes < 1) { 
    setOfferError("أدخل وقتاً صحيحاً بالدقائق"); 
    return; 
  }
  setOfferError("");
  
  // ✅ تحديث فوري للواجهة
  setSubmittedOrders(prev => new Set(prev).add(offerModal!.orderId));
  
  // ✅ إرسال العرض
  submitDriverBid(offerModal!.orderId, {
    driverId: driverId,
    driverName: user?.fullName || "سائق",
    driverPhone: user?.phone || "",
    driverRating: user?.rating || 4.5,
    totalDeliveries: user?.totalDeliveries || 0,
    vehicleType: offerModal!.vehicleType as any,
    price: price,
    estimatedMinutes: minutes,
  });
  
  setOfferModal(null);
  showToast("تم تقديم عرضك بنجاح! انتظر اختيار العميل.");
};

  // تحديث حالة الطلب
  const handleUpdateStage = (orderId: string, currentStatus: string) => {
    let nextStatus = "";
    let nextLabel = "";
    let nextColor = "";
    
    if (currentStatus === "accepted") {
      nextStatus = "going";
      nextLabel = "في الطريق للاستلام";
      nextColor = "#FFA63D";
    } else if (currentStatus === "going") {
      nextStatus = "picked";
      nextLabel = "تم استلام الطرد";
      nextColor = "#6C63FF";
    } else if (currentStatus === "picked") {
      nextStatus = "delivered";
      nextLabel = "تم التوصيل";
      nextColor = "#28A745";
    } else {
      return;
    }
    
    setStageConfirm({ orderId, currentStatus, nextStatus, nextLabel, nextColor });
  };

  const confirmStageUpdate = () => {
    if (!stageConfirm) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateDriverStatus(stageConfirm.orderId, stageConfirm.nextStatus as any);
    setStageConfirm(null);
    showToast("تم تحديث حالة الطلب ✓");
  };

  // حساب الإحصائيات للهيدر
  const stats = [
    { label: "توصيلات", value: completedCount.toString(), icon: "check-circle", color: "#28A745" },
    { label: "التقييم", value: avgRating > 0 ? avgRating.toFixed(1) : "جديد", icon: "star", color: "#FFC107" },
    { label: "رصيد", value: `${user?.commissionBalance || 0} ₪`, icon: "wallet", color: "#6C63FF" },
  ];

  // حالة الطلب النشط - عرض خاص
  if (activeOrder && !stageConfirm) {
    const stage = getStageConfig(activeOrder.status);
    const canProceed = stage.nextAction !== null;
    
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.activeHeader, { backgroundColor: "#28A745", paddingTop: topPad + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-right" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.activeHeaderTitle}>🚚 طلب نشط</Text>
        </View>
        
        <View style={[styles.activeOrderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.activeOrderIcon}>
            <Feather name="package" size={40} color="#28A745" />
          </View>
          <Text style={[styles.activeOrderId, { color: colors.foreground }]}>#{activeOrder.id}</Text>
          
          {/* مرحلة التوصيل الحالية */}
          <View style={[styles.stageBadge, { backgroundColor: stage.color + "18" }]}>
            <Feather name={stage.icon} size={14} color={stage.color} />
            <Text style={[styles.stageText, { color: stage.color }]}>{stage.label}</Text>
          </View>
          
          <View style={styles.activeOrderRoute}>
            <View style={styles.activeOrderRow}>
              <View style={[styles.activeDot, { backgroundColor: "#28A745" }]} />
              <Text style={[styles.activeOrderAddress, { color: colors.textGray }]} numberOfLines={1}>
                {activeOrder.pickupAddress}
              </Text>
            </View>
            <View style={styles.activeOrderLine} />
            <View style={styles.activeOrderRow}>
              <View style={[styles.activeDot, { backgroundColor: "#FF6584" }]} />
              <Text style={[styles.activeOrderAddress, { color: colors.textGray }]} numberOfLines={1}>
                {activeOrder.deliveryAddress}
              </Text>
            </View>
          </View>
          
          <View style={styles.activeOrderInfo}>
            <View style={styles.activeInfoItem}>
              <Feather name="clock" size={14} color={colors.textLight} />
              <Text style={[styles.activeInfoText, { color: colors.textGray }]}>
                {activeOrder.selectedOffer?.estimatedMinutes || "?"} دقيقة متوقعة
              </Text>
            </View>
            <View style={styles.activeInfoItem}>
              <Feather name="tag" size={14} color={colors.textLight} />
              <Text style={[styles.activeInfoText, { color: colors.textGray }]}>
                {activeOrder.finalPrice} ₪
              </Text>
            </View>
          </View>
          
          {canProceed && (
            <TouchableOpacity
              style={[styles.trackBtn, { backgroundColor: stage.color }]}
              onPress={() => handleUpdateStage(activeOrder.id, activeOrder.status)}
            >
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={styles.trackBtnText}>{stage.nextAction}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.detailsBtn, { borderColor: colors.border }]}
            onPress={() => router.push({ pathname: "/track-order", params: { orderId: activeOrder.id } })}
          >
            <Feather name="map-pin" size={16} color={colors.textGray} />
            <Text style={[styles.detailsBtnText, { color: colors.textGray }]}>عرض تفاصيل الطلب</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

<View style={[styles.header, { backgroundColor: "#28A745", paddingTop: topPad + 16 }]}>
  <View style={styles.headerRow}>
    <View style={styles.headerLeft}>
      <Text style={styles.greeting}>مرحباً 👋</Text>
      <Text style={styles.driverName}>{user?.fullName || "السائق"}</Text>
    </View>
    
    <View style={styles.headerRight}>
      <View style={styles.statsRow}>
        {stats.map((stat, idx) => (
          <View key={idx} style={styles.statItem}>
            <Text style={styles.statVal}>{stat.value}</Text>
            <Text style={styles.statLbl}>{stat.label}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity 
        style={styles.profileBtn}
          onPress={() => router.push("/profile")}
      >
        <Feather name="user" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  </View>

  {user?.commissionBalance === 0 && (
    <TouchableOpacity style={[styles.alertBanner, { backgroundColor: "#FFC107" }]} onPress={() => router.push("/(driver)/agents")}>
      <Feather name="alert-triangle" size={14} color="#fff" />
      <Text style={styles.alertText}>رصيدك صفر! اضغط لعرض الوكلاء المعتمدين</Text>
    </TouchableOpacity>
  )}
</View>

      {/* Filter Tabs */}
      <View style={[styles.filterRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {[
          { key: "available" as const, label: `متاحة (${availableOrders.length})` },
          { key: "active" as const, label: `نشطة (${myActiveOrders.length})` },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, { borderBottomColor: activeFilter === f.key ? "#28A745" : "transparent" }]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.filterLabel, { color: activeFilter === f.key ? "#28A745" : colors.textGray }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>


      {/* زر المكافئات */}
      <View style={styles.rewardsSection}>
        <TouchableOpacity
          style={[styles.rewardsBtn, { backgroundColor: "#FFC107" }]}
          onPress={() => router.push("/rewards")}
        >
          <Feather name="award" size={22} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.rewardsBtnTitle}>🏆 المكافئات والمستويات</Text>
            <Text style={styles.rewardsBtnSub}>تعرف على مكافآتك والمستوى التالي</Text>
          </View>
          <Feather name="chevron-left" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* قائمة الطلبات */}
{activeFilter === "available" ? (
  <FlatList
    data={availableOrders}
    keyExtractor={(item) => item.id}
    contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}
    showsVerticalScrollIndicator={false}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#28A745" />}
    ListEmptyComponent={
      <View style={styles.empty}>
        <Feather name="inbox" size={48} color={colors.textLight} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد طلبات متاحة</Text>
        <Text style={[styles.emptySub, { color: colors.textGray }]}>اسحب للأسفل للتحديث</Text>
      </View>
    }
    renderItem={({ item }) => {
      // التحقق مما إذا كان السائق قد قدم عرضاً لهذا الطلب
      const hasSubmittedOffer =submittedOrders.has(item.id) || 
        item.offers?.some((offer: any) => offer.driverId === driverId);
      
      return (
        <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardTop}>
            <Text style={[styles.orderId, { color: colors.foreground }]}>#{item.id}</Text>
            <View style={[styles.newBadge, { backgroundColor: "#FFF8E1" }]}>
              <Text style={{ color: "#FFC107", fontSize: 11, fontWeight: "700" }}>جديد</Text>
            </View>
          </View>
          
          <View style={styles.route}>
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: "#28A745" }]} />
              <Text style={[styles.addr, { color: colors.textGray }]} numberOfLines={1}>{item.pickupAddress}</Text>
            </View>
            <View style={[styles.routeLine, { borderColor: colors.border }]} />
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: "#FF6584" }]} />
              <Text style={[styles.addr, { color: colors.textGray }]} numberOfLines={1}>{item.deliveryAddress}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={[styles.chip, { backgroundColor: colors.muted }]}>
              <Feather name="package" size={12} color={colors.textGray} />
              <Text style={[styles.chipText, { color: colors.textGray }]}>{item.packageDescription}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.muted }]}>
              <Feather name="credit-card" size={12} color={colors.textGray} />
              <Text style={[styles.chipText, { color: colors.textGray }]}>
                {item.paymentMethod === "cash" ? "كاش" : "إلكتروني"}
              </Text>
            </View>
          </View>
          
          {hasSubmittedOffer ? (
            <View style={[styles.submittedBtn, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
              <Feather name="clock" size={18} color={colors.primary} />
              <Text style={[styles.submittedBtnText, { color: colors.primary }]}>بانتظار رد العميل</Text>
              <Feather name="check-circle" size={14} color={colors.primary} />
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.acceptBtn, { backgroundColor: "#28A745" }]}
              onPress={() => {
                setOfferPrice("");
                setOfferMinutes("");
                setOfferError("");
                setOfferModal({ 
                  orderId: item.id, 
                  pickupAddress: item.pickupAddress, 
                  deliveryAddress: item.deliveryAddress,
                  vehicleType: item.vehicleType
                });
              }}
              activeOpacity={0.85}
            >
              <Feather name="tag" size={18} color="#fff" />
              <Text style={styles.acceptBtnText}>تقديم عرض سعر</Text>
              <Feather name="chevron-left" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      );
    }}
  />
) :(
        <FlatList
          data={myActiveOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#28A745" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="navigation" size={48} color={colors.textLight} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد طلبات نشطة</Text>
            </View>
          }
renderItem={({ item }) => {
  // ✅ التحقق مما إذا كان السائق قد قدم عرضاً
  const hasSubmittedOffer = submittedOrders.has(item.id) || 
    item.offers?.some((offer: any) => offer.driverId === driverId);
  
  return (
    <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <Text style={[styles.orderId, { color: colors.foreground }]}>#{item.id}</Text>
        <View style={[styles.newBadge, { backgroundColor: "#FFF8E1" }]}>
          <Text style={{ color: "#FFC107", fontSize: 11, fontWeight: "700" }}>جديد</Text>
        </View>
      </View>
      
      <View style={styles.route}>
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: "#28A745" }]} />
          <Text style={[styles.addr, { color: colors.textGray }]} numberOfLines={1}>{item.pickupAddress}</Text>
        </View>
        <View style={[styles.routeLine, { borderColor: colors.border }]} />
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: "#FF6584" }]} />
          <Text style={[styles.addr, { color: colors.textGray }]} numberOfLines={1}>{item.deliveryAddress}</Text>
        </View>
      </View>
      
      <View style={styles.infoRow}>
        <View style={[styles.chip, { backgroundColor: colors.muted }]}>
          <Feather name="package" size={12} color={colors.textGray} />
          <Text style={[styles.chipText, { color: colors.textGray }]}>{item.packageDescription}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: colors.muted }]}>
          <Feather name="credit-card" size={12} color={colors.textGray} />
          <Text style={[styles.chipText, { color: colors.textGray }]}>
            {item.paymentMethod === "cash" ? "كاش" : "إلكتروني"}
          </Text>
        </View>
      </View>
      
      {hasSubmittedOffer ? (
        <View style={[styles.submittedBtn, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
          <Feather name="clock" size={18} color={colors.primary} />
          <Text style={[styles.submittedBtnText, { color: colors.primary }]}>بانتظار رد العميل</Text>
          <Feather name="check-circle" size={14} color={colors.primary} />
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: "#28A745" }]}
          onPress={() => {
            setOfferPrice("");
            setOfferMinutes("");
            setOfferError("");
            setOfferModal({ 
              orderId: item.id, 
              pickupAddress: item.pickupAddress, 
              deliveryAddress: item.deliveryAddress,
              vehicleType: item.vehicleType
            });
          }}
          activeOpacity={0.85}
        >
          <Feather name="tag" size={18} color="#fff" />
          <Text style={styles.acceptBtnText}>تقديم عرض سعر</Text>
          <Feather name="chevron-left" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}}
        />
      )}

      {/* Offer Modal */}
{/* ┌─────────────────────────────────────────────────────────────┐ */}
{/* │                    تقديم عرض سعر - نسخة احترافية            │ */}
{/* └─────────────────────────────────────────────────────────────┘ */}
<Modal 
  visible={!!offerModal} 
  transparent 
  animationType="fade" 
  onRequestClose={() => setOfferModal(null)}
>
  <TouchableOpacity 
    style={styles.offerModalOverlay} 
    activeOpacity={1} 
    onPress={() => setOfferModal(null)}
  >
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.offerKeyboardView}
    >
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={(e) => e.stopPropagation()} 
        style={[styles.offerModalContainer, { backgroundColor: colors.card }]}
      >
        {/* سحب للإغلاق */}
        <View style={styles.offerDragHandle}>
          <View style={[styles.offerDragBar, { backgroundColor: colors.border }]} />
        </View>

        {/* رأس النموذج مع أيقونة */}
        <View style={styles.offerModalHeader}>
          <View style={[styles.offerHeaderIcon, { backgroundColor: "#28A74515" }]}>
            <Feather name="tag" size={24} color="#28A745" />
          </View>
          <View style={styles.offerHeaderText}>
            <Text style={[styles.offerTitle, { color: colors.foreground }]}>تقديم عرض سعر</Text>
            <Text style={[styles.offerSubtitle, { color: colors.textGray }]}>حدد السعر والوقت المتوقع</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setOfferModal(null)} 
            style={[styles.offerCloseBtn, { backgroundColor: colors.muted }]}
          >
            <Feather name="x" size={18} color={colors.textGray} />
          </TouchableOpacity>
        </View>

        {/* معلومات الطلب - بطاقة منفصلة */}
        {offerModal && (
          <View style={[styles.offerRouteCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.offerRouteHeader}>
              <Feather name="navigation" size={14} color={colors.primary} />
              <Text style={[styles.offerRouteHeaderText, { color: colors.textGray }]}>تفاصيل الطلب</Text>
            </View>
            
            <View style={styles.offerRouteContent}>
              <View style={styles.offerRouteItem}>
                <View style={[styles.offerRouteDot, { backgroundColor: "#28A745" }]} />
                <Text style={[styles.offerRouteLabel, { color: colors.textGray }]}>الاستلام:</Text>
                <Text style={[styles.offerRouteAddress, { color: colors.foreground }]} numberOfLines={1}>
                  {offerModal.pickupAddress}
                </Text>
              </View>
              
              <View style={styles.offerRouteConnector}>
                <View style={[styles.offerRouteLine, { backgroundColor: colors.border }]} />
                <Feather name="arrow-down" size={12} color={colors.textLight} />
                <View style={[styles.offerRouteLine, { backgroundColor: colors.border }]} />
              </View>
              
              <View style={styles.offerRouteItem}>
                <View style={[styles.offerRouteDot, { backgroundColor: "#FF6584" }]} />
                <Text style={[styles.offerRouteLabel, { color: colors.textGray }]}>التسليم:</Text>
                <Text style={[styles.offerRouteAddress, { color: colors.foreground }]} numberOfLines={1}>
                  {offerModal.deliveryAddress}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* حقول الإدخال */}
        <View style={styles.offerInputsContainer}>
          {/* حقل السعر */}
          <View style={styles.offerInputGroup}>
            <Text style={[styles.offerInputLabel, { color: colors.textGray }]}>
              <Feather name="dollar-sign" size={14} color="#28A745" /> السعر المقترح
            </Text>
            <View style={[
              styles.offerInputWrapper,
              { 
                backgroundColor: colors.background, 
                borderColor: offerError ? "#EF5350" : colors.border,
                borderWidth: offerError ? 2 : 1.5,
              }
            ]}>
              <Text style={styles.offerCurrencySymbol}>₪</Text>
              <TextInput
                style={[styles.offerInput, { color: colors.foreground }]}
                value={offerPrice}
                onChangeText={(v) => { setOfferPrice(v); setOfferError(""); }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textLight}
                autoFocus={true}
              />
              <Text style={styles.offerInputHint}>شيكل</Text>
            </View>
          </View>

          {/* حقل الوقت */}
          <View style={styles.offerInputGroup}>
            <Text style={[styles.offerInputLabel, { color: colors.textGray }]}>
              <Feather name="clock" size={14} color="#6C63FF" /> الوقت المتوقع
            </Text>
            <View style={[
              styles.offerInputWrapper,
              { backgroundColor: colors.background, borderColor: colors.border }
            ]}>
              <TextInput
                style={[styles.offerInput, { color: colors.foreground }]}
                value={offerMinutes}
                onChangeText={(v) => { setOfferMinutes(v); setOfferError(""); }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textLight}
              />
              <Text style={styles.offerInputHint}>دقيقة</Text>
            </View>
          </View>
        </View>

        {/* رسالة الخطأ */}
        {offerError !== "" && (
          <View style={styles.offerErrorContainer}>
            <Feather name="alert-circle" size={16} color="#EF5350" />
            <Text style={styles.offerErrorText}>{offerError}</Text>
          </View>
        )}

        {/* معلومات إضافية */}
        <View style={[styles.offerInfoBox, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
          <Feather name="info" size={14} color={colors.primary} />
          <Text style={[styles.offerInfoText, { color: colors.textGray }]}>
            سيتم عرض عرضك على العميل مع عروض السائقين الآخرين
          </Text>
        </View>

        {/* أزرار الإجراء */}
        <View style={styles.offerActions}>
          <TouchableOpacity 
            style={[styles.offerCancelBtn, { backgroundColor: colors.muted }]} 
            onPress={() => setOfferModal(null)}
          >
            <Text style={[styles.offerCancelText, { color: colors.textGray }]}>إلغاء</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.offerSubmitBtn, { backgroundColor: "#28A745" }]} 
            onPress={handleSubmitOffer}
          >
            <Feather name="check-circle" size={18} color="#fff" />
            <Text style={styles.offerSubmitText}>تأكيد العرض</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  </TouchableOpacity>
</Modal>

      {/* Stage Confirm Modal */}
      <Modal visible={!!stageConfirm} transparent animationType="fade" onRequestClose={() => setStageConfirm(null)}>
        <View style={[styles.modalOverlay, { justifyContent: "center", paddingHorizontal: 24 }]}>
          <View style={[styles.confirmCard, { backgroundColor: colors.card }]}>
            <View style={[styles.confirmIconWrap, { backgroundColor: (stageConfirm?.nextColor ?? "#28A745") + "18" }]}>
              <Feather name="check-circle" size={32} color={stageConfirm?.nextColor ?? "#28A745"} />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>تأكيد التحديث</Text>
            <Text style={[styles.confirmSub, { color: colors.textGray }]}>
              هل تريد تغيير الحالة إلى:{"\n"}
              <Text style={{ fontWeight: "800", color: stageConfirm?.nextColor ?? "#28A745" }}>
                {stageConfirm?.nextLabel}
              </Text>
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.muted }]} onPress={() => setStageConfirm(null)}>
                <Text style={[styles.confirmBtnText, { color: colors.textGray }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: stageConfirm?.nextColor ?? "#28A745" }]} onPress={confirmStageUpdate}>
                <Text style={[styles.confirmBtnText, { color: "#fff" }]}>تأكيد</Text>
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
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  
  // Header
  header: { paddingHorizontal: 20, paddingBottom: 20 },
headerRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
},
  greeting: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
  driverName: { color: "#fff", fontSize: 20, fontWeight: "700" },
  statsRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, padding: 10, gap: 10 },
  statItem: { alignItems: "center" },
  statVal: { color: "#fff", fontSize: 16, fontWeight: "700" },
  statLbl: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  
  alertBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  alertText: { color: "#fff", fontSize: 13, fontWeight: "600", flex: 1 },
  
  // Filters
  filterRow: { flexDirection: "row", borderBottomWidth: 1 },
  filterTab: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2 },
  filterLabel: { fontSize: 14, fontWeight: "600" },
  
  // Order Card
  orderCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 14, fontWeight: "700" },
  newBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  route: { gap: 4 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  addr: { fontSize: 13, flex: 1 },
  routeLine: { height: 1, borderWidth: 0.5, borderStyle: "dashed" },
  infoRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  chipText: { fontSize: 12 },
acceptBtn: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  paddingVertical: 14,
  borderRadius: 14,
  marginTop: 8,
  shadowColor: "#28A745",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 3,
},
acceptBtnText: {
  color: "#fff",
  fontSize: 15,
  fontWeight: "700",
},
  // acceptText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 11, fontWeight: "600" },
  
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptySub: { fontSize: 14 },
  
  // Active Order
  activeHeader: { paddingHorizontal: 20, paddingBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 },
  activeHeaderTitle: { color: "#fff", fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center" },
  activeOrderCard: { margin: 16, borderRadius: 20, borderWidth: 1, padding: 20, alignItems: "center", gap: 12 },
  activeOrderIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#28A74518", justifyContent: "center", alignItems: "center" },
  activeOrderId: { fontSize: 16, fontWeight: "700" },
  stageBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  stageText: { fontSize: 12, fontWeight: "600" },
  activeOrderRoute: { width: "100%", gap: 8, marginVertical: 8 },
  activeOrderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  activeOrderLine: { height: 20, width: 2, marginLeft: 4, backgroundColor: "#E5E5E5" },
  activeOrderAddress: { fontSize: 13, flex: 1 },
  activeOrderInfo: { flexDirection: "row", gap: 16, marginVertical: 8 },
  activeInfoItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  activeInfoText: { fontSize: 12 },
  trackBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  trackBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  detailsBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16 },
  detailsBtnText: { fontSize: 13 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14, paddingBottom: 32 },
  modalTitleRow: { flexDirection: "row", alignItems: "center" },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: "700", textAlign: "center" },
  modalClose: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  routeChip: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  routeChipText: { fontSize: 13, flex: 1 },
  inputRow: { flexDirection: "row", gap: 12 },
  inputGroup: { flex: 1, gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, fontWeight: "600" },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { color: "#EF5350", fontSize: 13, flex: 1 },
  modalActions: { flexDirection: "row", gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modalBtnText: { fontSize: 15, fontWeight: "700" },
  
  // Confirm Modal
  confirmCard: { borderRadius: 20, padding: 24, alignItems: "center", gap: 12 },
  confirmIconWrap: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  confirmTitle: { fontSize: 18, fontWeight: "800" },
  confirmSub: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  confirmBtns: { flexDirection: "row", gap: 10, width: "100%", marginTop: 4 },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  confirmBtnText: { fontSize: 15, fontWeight: "700" },
  // ============================================================
// أنماط نموذج تقديم عرض السعر - Offer Modal
// ============================================================

offerModalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.6)",
  justifyContent: "flex-end",
},
offerKeyboardView: {
  width: "100%",
  alignItems: "center",
  justifyContent: "flex-end",
},
offerModalContainer: {
  width: "100%",
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  paddingHorizontal: 20,
  paddingBottom: 30,
  gap: 20,
},

// سحب للإغلاق
offerDragHandle: {
  alignItems: "center",
  paddingTop: 12,
  paddingBottom: 4,
},
offerDragBar: {
  width: 50,
  height: 4,
  borderRadius: 2,
},

// رأس النموذج
offerModalHeader: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
},
offerHeaderIcon: {
  width: 48,
  height: 48,
  borderRadius: 14,
  justifyContent: "center",
  alignItems: "center",
},
offerHeaderText: {
  flex: 1,
},
offerTitle: {
  fontSize: 18,
  fontWeight: "800",
},
offerSubtitle: {
  fontSize: 12,
  marginTop: 2,
},
offerCloseBtn: {
  width: 36,
  height: 36,
  borderRadius: 18,
  justifyContent: "center",
  alignItems: "center",
},

// بطاقة معلومات الطلب
offerRouteCard: {
  borderRadius: 16,
  borderWidth: 1,
  padding: 16,
  gap: 12,
},
offerRouteHeader: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},
offerRouteHeaderText: {
  fontSize: 13,
  fontWeight: "600",
},
offerRouteContent: {
  gap: 8,
},
offerRouteItem: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
},
offerRouteDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
},
offerRouteLabel: {
  fontSize: 12,
  width: 50,
},
offerRouteAddress: {
  fontSize: 13,
  fontWeight: "500",
  flex: 1,
},
offerRouteConnector: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  marginLeft: 4,
  marginVertical: 4,
},
offerRouteLine: {
  flex: 1,
  height: 1,
},

// حقول الإدخال
offerInputsContainer: {
  gap: 16,
},
offerInputGroup: {
  gap: 8,
},
offerInputLabel: {
  fontSize: 13,
  fontWeight: "600",
},
offerInputWrapper: {
  flexDirection: "row",
  alignItems: "center",
  borderRadius: 14,
  paddingHorizontal: 16,
  height: 56,
},
offerCurrencySymbol: {
  fontSize: 20,
  fontWeight: "700",
  color: "#28A745",
  marginRight: 10,
},
offerInput: {
  flex: 1,
  fontSize: 20,
  fontWeight: "700",
  textAlign: "right",
},
offerInputHint: {
  fontSize: 13,
  color: "#6C757D",
  marginLeft: 10,
},

// رسالة الخطأ
offerErrorContainer: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  backgroundColor: "#EF535015",
  padding: 12,
  borderRadius: 12,
},
offerErrorText: {
  flex: 1,
  fontSize: 13,
  color: "#EF5350",
},

// معلومات إضافية
offerInfoBox: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  padding: 12,
  borderRadius: 12,
  borderWidth: 1,
},
offerInfoText: {
  flex: 1,
  fontSize: 12,
},

// أزرار الإجراء
offerActions: {
  flexDirection: "row",
  gap: 12,
  marginTop: 8,
},
offerCancelBtn: {
  flex: 1,
  paddingVertical: 14,
  borderRadius: 14,
  alignItems: "center",
},
offerCancelText: {
  fontSize: 15,
  fontWeight: "600",
},
offerSubmitBtn: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  paddingVertical: 14,
  borderRadius: 14,
},
offerSubmitText: {
  color: "#fff",
  fontSize: 15,
  fontWeight: "700",
},
// زر تقديم العرض (حالة نشطة)
// acceptBtn: {
//   flexDirection: "row",
//   alignItems: "center",
//   justifyContent: "center",
//   gap: 10,
//   paddingVertical: 14,
//   borderRadius: 14,
//   marginTop: 8,
//   shadowColor: "#28A745",
//   shadowOffset: { width: 0, height: 2 },
//   shadowOpacity: 0.3,
//   shadowRadius: 4,
//   elevation: 3,
// },
// acceptBtnText: {
//   color: "#fff",
//   fontSize: 15,
//   fontWeight: "700",
// },

// زر بعد تقديم العرض (في انتظار الرد)
submittedBtn: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  paddingVertical: 14,
  borderRadius: 14,
  borderWidth: 1.5,
  marginTop: 8,
},
submittedBtnText: {
  fontSize: 14,
  fontWeight: "600",
},
  // Rewards Button
  rewardsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  rewardsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#FFC107",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardsBtnTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  rewardsBtnSub: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    marginTop: 2,
  },
  headerLeft: {
  flex: 1,
},
headerRight: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
},
profileBtn: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: "rgba(255,255,255,0.2)",
  justifyContent: "center",
  alignItems: "center",
},

});