// app/order-offers.tsx
import { useOrders, DriverOffer } from "@/context/OrdersContext";
import { useAuth } from "@/context/AuthContext";
import { useFavorites, FavoriteDriver } from "@/context/FavoritesContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

const Tab = createMaterialTopTabNavigator();

const VEHICLE_LABELS: Record<string, string> = {
  car: "🚗 سيارة",
  bike: "🚲 باسكليت",
  truck: "🚛 سيارة نقل",
};

// ============ Component: StarRating ============
function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Feather
          key={s}
          name="star"
          size={size}
          color={s <= Math.round(rating) ? "#FFC107" : colors.border}
        />
      ))}
    </View>
  );
}

// ============ Component: OfferCard ============
function OfferCard({
  offer,
  isSelected,
  isBest,
  onSelect,
}: {
  offer: DriverOffer;
  isSelected: boolean;
  isBest: boolean;
  onSelect: () => void;
}) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[
        styles.offerCard,
        {
          backgroundColor: isSelected ? colors.primary + "08" : colors.card,
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      {isBest && (
        <View style={styles.bestBadge}>
          <Feather name="zap" size={10} color="#fff" />
          <Text style={styles.bestBadgeText}>الأرخص</Text>
        </View>
      )}

      <View style={styles.offerTop}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: isSelected ? colors.primary + "20" : colors.muted },
          ]}
        >
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {offer.driverName.charAt(0)}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.driverName, { color: colors.foreground }]}>
            {offer.driverName}
          </Text>
          <View style={styles.ratingRow}>
            <StarRating rating={offer.driverRating} />
            <Text style={[styles.ratingNum, { color: colors.textGray }]}>
              {offer.driverRating}
            </Text>
            <Text style={[styles.deliveries, { color: colors.textLight }]}>
              ({offer.totalDeliveries} توصيلة)
            </Text>
          </View>
          <Text style={[styles.vehicle, { color: colors.textGray }]}>
            {VEHICLE_LABELS[offer.vehicleType]}
          </Text>
        </View>

        <View style={styles.priceBlock}>
          <Text
            style={[
              styles.price,
              { color: isSelected ? colors.primary : colors.foreground },
            ]}
          >
            {offer.price} ₪
          </Text>
          <View style={styles.etaRow}>
            <Feather name="clock" size={11} color={colors.textLight} />
            <Text style={[styles.etaText, { color: colors.textGray }]}>
              ~{offer.estimatedMinutes} د
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.selectBtn,
          {
            backgroundColor: isSelected ? colors.primary : colors.primaryContainer,
          },
        ]}
        onPress={onSelect}
      >
        {isSelected ? (
          <>
            <Feather name="check" size={15} color="#fff" />
            <Text style={[styles.selectBtnText, { color: "#fff" }]}>تم الاختيار</Text>
          </>
        ) : (
          <Text style={[styles.selectBtnText, { color: colors.primary }]}>
            اختيار هذا السائق
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ============ Screen: Cheapest Offers (الأرخص) ============
function CheapestOffersScreen({ orderId, isTimerExpired }: { orderId: string; isTimerExpired: boolean }) {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getOrderById, selectOffer, cancelOrder } = useOrders();
  const { user } = useAuth();

  const [selectedOffer, setSelectedOffer] = useState<DriverOffer | null>(null);
  const [confirming, setConfirming] = useState(false);

  const order = getOrderById(orderId);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (order?.status === "accepted" && !confirming) {
      router.replace({ pathname: "/track-order", params: { orderId } });
    }
  }, [order?.status]);

  if (isTimerExpired) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.expiredContainer}>
          <Feather name="clock" size={48} color={colors.destructive} />
          <Text style={[styles.expiredTitle, { color: colors.foreground }]}>⏰ انتهت المهلة</Text>
          <Text style={[styles.expiredSub, { color: colors.textGray }]}>
            لم تختر سائقاً خلال 60 ثانية
          </Text>
          <View style={styles.expiredButtons}>
            <TouchableOpacity
              style={[styles.expiredCancel, { borderColor: colors.border }]}
              onPress={() => {
                cancelOrder(orderId);
                router.replace("/(customer)");
              }}
            >
              <Text style={{ color: colors.textGray }}>🗑 إلغاء الطلب</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.expiredRetry, { backgroundColor: colors.primary }]}
              onPress={() => {
                // إعادة تعيين المهلة - سيتم التعامل معها من المكون الرئيسي
              }}
            >
              <Text style={{ color: "#fff" }}>🔄 طلب عروض جديدة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={{ color: colors.textGray }}>الطلب غير موجود</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn2, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>رجوع</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isSearching = order.status === "searching";
  const offers = order.offers ?? [];

  const handleConfirm = async () => {
    if (!selectedOffer) return;
    setConfirming(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise((r) => setTimeout(r, 1000));
    selectOffer(orderId, selectedOffer);
    router.replace({ pathname: "/track-order", params: { orderId } });
  };

  const handleCancel = () => {
    Alert.alert("إلغاء الطلب", "هل تريد إلغاء هذا الطلب؟", [
      { text: "لا", style: "cancel" },
      {
        text: "نعم، إلغاء",
        style: "destructive",
        onPress: () => {
          cancelOrder(orderId);
          router.replace("/(customer)/" as any);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: 4,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          عروض السائقين
        </Text>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={[styles.cancelText, { color: colors.destructive }]}>إلغاء</Text>
        </TouchableOpacity>
      </View>

      {isSearching ? (
        <View style={styles.searchingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.searchingTitle, { color: colors.foreground }]}>
            جاري البحث عن سائقين...
          </Text>
          <Text style={[styles.searchingSub, { color: colors.textGray }]}>
            نرسل طلبك للسائقين الذين يمتلكون {VEHICLE_LABELS[order.vehicleType]}
          </Text>
          <View style={[styles.orderPreview, { backgroundColor: colors.muted }]}>
            <View style={styles.previewRow}>
              <Feather name="map-pin" size={14} color={colors.primary} />
              <Text style={[styles.previewText, { color: colors.textGray }]} numberOfLines={1}>
                {order.pickupAddress}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Feather name="flag" size={14} color={colors.secondary} />
              <Text style={[styles.previewText, { color: colors.textGray }]} numberOfLines={1}>
                {order.deliveryAddress}
              </Text>
            </View>
          </View>
          <Text style={[styles.waitText, { color: colors.textLight }]}>
            عادةً ما يستغرق هذا أقل من دقيقة
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.infoBanner, { backgroundColor: colors.primaryContainer }]}>
              <Feather name="info" size={16} color={colors.primary} />
              <Text style={[styles.infoBannerText, { color: colors.primary }]}>
                تم ترتيب العروض من الأرخص للأغلى مع تقييم كل سائق
              </Text>
            </View>

            <View style={[styles.orderSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
                #{order.id} • {order.packageDescription}
              </Text>
              <View style={styles.routeRow}>
                <Feather name="map-pin" size={12} color={colors.primary} />
                <Text style={[styles.routeText, { color: colors.textGray }]} numberOfLines={1}>
                  {order.pickupAddress}
                </Text>
              </View>
              <View style={styles.routeRow}>
                <Feather name="flag" size={12} color={colors.secondary} />
                <Text style={[styles.routeText, { color: colors.textGray }]} numberOfLines={1}>
                  {order.deliveryAddress}
                </Text>
              </View>
            </View>

            <Text style={[styles.offersTitle, { color: colors.foreground }]}>
              {offers.length} عروض متاحة — اختر الأنسب لك
            </Text>
            {offers.map((offer, i) => (
              <OfferCard
                key={offer.driverId}
                offer={offer}
                isSelected={selectedOffer?.driverId === offer.driverId}
                isBest={i === 0}
                onSelect={() => {
                  setSelectedOffer(offer);
                  Haptics.selectionAsync();
                }}
              />
            ))}

            {/* طريقة الدفع - لإعلام السائق فقط */}
            {order.paymentMethod === "cash" ? (
              <View style={[styles.paymentNote, { backgroundColor: "#28A74512", borderColor: "#28A74540" }]}>
                <Text style={{ fontSize: 20 }}>💵</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paymentNoteTitle, { color: "#28A745" }]}>الدفع نقداً عند الاستلام</Text>
                  <Text style={[styles.paymentNoteSub, { color: colors.textGray }]}>
                    ستدفع للسائق نقداً مباشرة عند استلام الطرد
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.paymentNote, { backgroundColor: "#1E88E512", borderColor: "#1E88E540" }]}>
                <Text style={{ fontSize: 20 }}>💳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paymentNoteTitle, { color: "#1E88E5" }]}>دفع إلكتروني</Text>
                  <Text style={[styles.paymentNoteSub, { color: colors.textGray }]}>
                    سيتم الدفع عبر بطاقة أو تحويل بنكي (خارج التطبيق)
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View
            style={[
              styles.bottomBar,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                paddingBottom: Platform.OS === "web" ? 16 : insets.bottom + 8,
              },
            ]}
          >
            {selectedOffer && (
              <View style={styles.selectedSummary}>
                <Text style={[styles.selectedName, { color: colors.foreground }]}>
                  {selectedOffer.driverName}
                </Text>
                <Text style={[styles.selectedPrice, { color: colors.primary }]}>
                  {selectedOffer.price} ₪
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: selectedOffer ? colors.secondary : colors.muted }]}
              onPress={handleConfirm}
              disabled={!selectedOffer || confirming}
              activeOpacity={0.85}
            >
              {confirming ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="check-circle" size={20} color={selectedOffer ? "#fff" : colors.textLight} />
                  <Text style={[styles.confirmBtnText, { color: selectedOffer ? "#fff" : colors.textLight }]}>
                    {selectedOffer ? `تأكيد اختيار ${selectedOffer.driverName}` : "اختر سائقاً للمتابعة"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// ============ Screen: Favorites Offers (المفضلين) ============
function FavoritesOffersScreen({ orderId, isTimerExpired }: { orderId: string; isTimerExpired: boolean }) {
  const colors = useColors();
  const router = useRouter();
  const { getOrderById, sendCustomOfferToDriver } = useOrders();
  const { favorites } = useFavorites();

  const [selectedDriver, setSelectedDriver] = useState<FavoriteDriver | null>(null);
  const [price, setPrice] = useState("");
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [sending, setSending] = useState(false);

  const order = getOrderById(orderId);

  if (isTimerExpired) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.expiredContainer}>
          <Feather name="clock" size={48} color={colors.destructive} />
          <Text style={[styles.expiredTitle, { color: colors.foreground }]}>⏰ انتهت المهلة</Text>
          <Text style={[styles.expiredSub, { color: colors.textGray }]}>
            لم تختر سائقاً خلال 60 ثانية
          </Text>
          <View style={styles.expiredButtons}>
            <TouchableOpacity
              style={[styles.expiredCancel, { borderColor: colors.border }]}
              onPress={() => router.back()}
            >
              <Text style={{ color: colors.textGray }}>🗑 رجوع</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={{ color: colors.textGray }}>الطلب غير موجود</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSelectDriver = (driver: FavoriteDriver) => {
    setSelectedDriver(driver);
    setShowPriceModal(true);
  };

  const handleSubmitOffer = async () => {
    const priceNum = parseFloat(price);
    if (!priceNum || priceNum < 3) {
      Alert.alert("سعر غير صالح", "الرجاء إدخال سعر صالح (3 شيكل على الأقل)");
      return;
    }

    setSending(true);
    const result = await sendCustomOfferToDriver(orderId, selectedDriver!.id, priceNum);
    setShowPriceModal(false);
    setPrice("");
    setSending(false);

    if (result.success) {
      Alert.alert("✓ تم الإرسال", `تم إرسال عرض ${priceNum} شيكل إلى ${selectedDriver?.name}. في انتظار قبوله.`, [
        { text: "حسناً", onPress: () => router.back() },
      ]);
    } else if (result.driverBusy) {
      Alert.alert("⚠️ السائق مشغول", `${selectedDriver?.name} مشغول حالياً. سيتم عرض أرخص 3 عروض بديلة لك.`, [
        { text: "عرض أرخص العروض" },
      ]);
    } else {
      Alert.alert("خطأ", "حدث خطأ. يرجى المحاولة مرة أخرى.");
    }
  };

  if (favorites.length === 0) {
    return (
      <View style={[styles.emptyFavorites, { backgroundColor: colors.background }]}>
        <Feather name="star" size={48} color={colors.textLight} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>⭐ ليس لديك سائقين مفضلين بعد</Text>
        <Text style={[styles.emptySub, { color: colors.textGray }]}>
          بعد إتمام طلب مع سائق، يمكنك إضافته إلى مفضلاتك من شاشة التقييم
        </Text>
        <TouchableOpacity style={[styles.backToOrders, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>رجوع للطلبات</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.miniOrderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.miniOrderText, { color: colors.textGray }]} numberOfLines={1}>
            📍 {order.pickupAddress} → {order.deliveryAddress}
          </Text>
        </View>

        <Text style={[styles.favTitle, { color: colors.foreground }]}>⭐ سائقيك المفضلين ({favorites.length}/5)</Text>

        {favorites.map((driver) => (
          <View key={driver.id} style={[styles.favDriverCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.favDriverAvatar}>
              <Text style={[styles.favAvatarText, { color: colors.primary }]}>{driver.name.charAt(0)}</Text>
            </View>
            <View style={styles.favDriverInfo}>
              <Text style={[styles.favDriverName, { color: colors.foreground }]}>{driver.name}</Text>
              <View style={styles.favRatingRow}>
                <StarRating rating={driver.rating} size={12} />
                <Text style={[styles.favRatingNum, { color: colors.textGray }]}>{driver.rating}</Text>
              </View>
              <Text style={[styles.favCompleted, { color: colors.textLight }]}>✅ {driver.completedOrdersWithMe} طلب مكتمل معك</Text>
            </View>
            <TouchableOpacity style={[styles.favOrderBtn, { backgroundColor: colors.secondary }]} onPress={() => handleSelectDriver(driver)}>
              <Text style={styles.favOrderBtnText}>اطلب الآن</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showPriceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>💰 حدد السعر</Text>
            <Text style={[styles.modalSub, { color: colors.textGray }]}>أدخل المبلغ الذي تريد دفعه للسائق {selectedDriver?.name}</Text>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={[styles.priceInput, { borderColor: colors.border, color: colors.foreground }]}
                keyboardType="numeric"
                placeholder="السعر (شيكل)"
                placeholderTextColor={colors.textLight}
                value={price}
                onChangeText={setPrice}
                autoFocus
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancel, { borderColor: colors.border }]}
                onPress={() => {
                  setShowPriceModal(false);
                  setPrice("");
                }}
              >
                <Text style={{ color: colors.textGray }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSubmit, { backgroundColor: colors.secondary }]} onPress={handleSubmitOffer} disabled={sending}>
                {sending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalSubmitText}>إرسال العرض</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ============ Main Component with Tabs ============
export default function OrderOffersWrapper() {
  const colors = useColors();
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [timeLeft, setTimeLeft] = useState(60);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRetry = () => {
    setTimeLeft(60);
    setIsExpired(false);
  };

  if (isExpired) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.expiredContainer}>
          <Feather name="clock" size={48} color={colors.destructive} />
          <Text style={[styles.expiredTitle, { color: colors.foreground }]}>⏰ انتهت المهلة</Text>
          <Text style={[styles.expiredSub, { color: colors.textGray }]}>لم تختر سائقاً خلال 60 ثانية</Text>
          <View style={styles.expiredButtons}>
            <TouchableOpacity style={[styles.expiredCancel, { borderColor: colors.border }]} onPress={() => router.back()}>
              <Text style={{ color: colors.textGray }}>🗑 إلغاء الطلب</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.expiredRetry, { backgroundColor: colors.primary }]} onPress={handleRetry}>
              <Text style={{ color: "#fff" }}>🔄 طلب عروض جديدة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Timer Bar */}
      <View style={[styles.timerBar, { backgroundColor: colors.primary + "10" }]}>
        <Feather name="clock" size={14} color={colors.primary} />
        <Text style={[styles.timerText, { color: colors.primary }]}>متبقي {formatTime(timeLeft)} للاختيار</Text>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.background,
            height: 60,
            paddingTop: 0,
            marginTop: 0,
            justifyContent: "flex-end",
          },
          tabBarIndicatorStyle: { backgroundColor: colors.primary, height: 3 },
          tabBarLabelStyle: { fontSize: 13, fontWeight: "600", textTransform: "none" },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textGray,
        }}
      >
        <Tab.Screen
          name="cheapest"
          children={() => <CheapestOffersScreen orderId={orderId!} isTimerExpired={false} />}
          options={{ title: "🏆 أرخص 3" }}
        />
        <Tab.Screen
          name="favorites"
          children={() => <FavoritesOffersScreen orderId={orderId!} isTimerExpired={false} />}
          options={{ title: "⭐ مفضلتي" }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

// ============ Styles ============
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", textAlign: "center" },
  cancelText: { fontSize: 14, fontWeight: "600" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  backBtn2: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  searchingBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  searchingTitle: { fontSize: 20, fontWeight: "700" },
  searchingSub: { fontSize: 14, textAlign: "center" },
  waitText: { fontSize: 12 },
  orderPreview: { width: "100%", borderRadius: 12, padding: 14, gap: 8 },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  previewText: { fontSize: 13, flex: 1 },
  infoBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12 },
  infoBannerText: { fontSize: 13, flex: 1, fontWeight: "500" },
  orderSummary: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  summaryTitle: { fontSize: 14, fontWeight: "700" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeText: { fontSize: 13, flex: 1 },
  offersTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  offerCard: { borderRadius: 16, padding: 16, gap: 12, position: "relative", overflow: "hidden" },
  bestBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#28A745",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomRightRadius: 10,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  bestBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  offerTop: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 20, fontWeight: "700" },
  driverName: { fontSize: 15, fontWeight: "700" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  ratingNum: { fontSize: 12, fontWeight: "600" },
  deliveries: { fontSize: 11 },
  vehicle: { fontSize: 12, marginTop: 3 },
  priceBlock: { alignItems: "center", gap: 4 },
  price: { fontSize: 22, fontWeight: "800" },
  etaRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  etaText: { fontSize: 12 },
  selectBtn: { borderRadius: 10, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  selectBtnText: { fontSize: 14, fontWeight: "700" },
  paymentNote: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  paymentNoteTitle: { fontSize: 14, fontWeight: "700" },
  paymentNoteSub: { fontSize: 12, marginTop: 2 },
  bottomBar: { padding: 16, borderTopWidth: 1, gap: 10 },
  selectedSummary: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  selectedName: { fontSize: 14, fontWeight: "600" },
  selectedPrice: { fontSize: 18, fontWeight: "800" },
  confirmBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  confirmBtnText: { fontSize: 16, fontWeight: "700" },
  emptyFavorites: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptySub: { fontSize: 14, textAlign: "center", marginBottom: 20 },
  backToOrders: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  miniOrderCard: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  miniOrderText: { fontSize: 12 },
  favTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, marginTop: 4 },
  favDriverCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  favDriverAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", backgroundColor: "#6C63FF20" },
  favAvatarText: { fontSize: 20, fontWeight: "700" },
  favDriverInfo: { flex: 1, gap: 4 },
  favDriverName: { fontSize: 15, fontWeight: "700" },
  favRatingRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  favRatingNum: { fontSize: 12 },
  favCompleted: { fontSize: 11 },
  favOrderBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  favOrderBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", borderRadius: 20, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  modalSub: { fontSize: 13, textAlign: "center" },
  priceInputContainer: { marginVertical: 8 },
  priceInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, textAlign: "center" },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  modalSubmit: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  modalSubmitText: { color: "#fff", fontWeight: "700" },
  timerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 13,
    fontWeight: "600",
  },
  expiredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  expiredTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  expiredSub: {
    fontSize: 14,
    textAlign: "center",
  },
  expiredButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  expiredCancel: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  expiredRetry: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
});