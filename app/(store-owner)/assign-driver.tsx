// app/(store-owner)/assign-driver.tsx
import { useAuth } from "@/context/AuthContext";
import { useOrders, DriverOffer } from "@/context/OrdersContext";
import { useStoreOrder, StoreOrder } from "@/context/StoreOrderContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
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

// واجهة للسائق مع معلومات إضافية
interface DriverWithDistance {
  id: string;
  driverName: string;
  fullName: string;
  phone: string;
  rating: number;
  driverRating: number;
  totalDeliveries: number;
  vehicleType: "car" | "bike" | "truck";
  distance?: number;
  estimatedTime?: number;
  suggestedPrice?: number;
}

// دالة لحساب المسافة العشوائية (للتجربة)
const calculateRandomDistance = () => {
  return +(Math.random() * 5 + 0.5).toFixed(1); // 0.5 - 5.5 كم
};

// دالة لحساب السعر المقترح
const calculateSuggestedPrice = (distance: number, vehicleType: string) => {
  const basePrice = 5;
  const pricePerKm = vehicleType === 'truck' ? 4 : vehicleType === 'car' ? 3 : 2;
  return Math.ceil(basePrice + (distance * pricePerKm));
};

// دالة لحساب الوقت المقدر
const calculateEstimatedTime = (distance: number, vehicleType: string) => {
  const speed = vehicleType === 'car' ? 30 : vehicleType === 'bike' ? 25 : 20; // كم/ساعة
  return Math.ceil((distance / speed) * 60);
};

export default function AssignDriverScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { user } = useAuth();
  const { getOrderById: getStoreOrderById, updateOrderStatus } = useStoreOrder();
  const { getAvailableDrivers, submitDriverBid } = useOrders();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [storeOrder, setStoreOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMinutes, setOfferMinutes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sortType, setSortType] = useState<'rating' | 'distance' | 'price'>('rating');
  const [driversWithDetails, setDriversWithDetails] = useState<DriverWithDistance[]>([]);

  useEffect(() => {
    if (orderId) {
      const order = getStoreOrderById(orderId);
      setStoreOrder(order || null);
    }
  }, [orderId]);

  const availableDrivers = getAvailableDrivers();

  // حساب التفاصيل الإضافية للسائقين
  useEffect(() => {
    if (availableDrivers.length > 0) {
      const driversWithInfo = availableDrivers.map((driver: any) => {
        const distance = calculateRandomDistance();
        const estimatedTime = calculateEstimatedTime(distance, driver.vehicleType);
        const suggestedPrice = calculateSuggestedPrice(distance, driver.vehicleType);
        
        return {
          ...driver,
          distance,
          estimatedTime,
          suggestedPrice,
        };
      });
      setDriversWithDetails(driversWithInfo);
    }
  }, [availableDrivers]);

  // دالة ترتيب السائقين
  const getSortedDrivers = () => {
    const sorted = [...driversWithDetails];
    
    switch (sortType) {
      case 'distance':
        return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      case 'price':
        return sorted.sort((a, b) => (a.suggestedPrice || 0) - (b.suggestedPrice || 0));
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default:
        return sorted;
    }
  };

  const handleSelectDriver = (driver: any) => {
    setSelectedDriver(driver);
    // تعبئة السعر والوقت المقترح تلقائياً
    setOfferPrice(driver.suggestedPrice?.toString() || "");
    setOfferMinutes(driver.estimatedTime?.toString() || "");
  };

  const handleSubmitOffer = async () => {
    if (!selectedDriver) {
      Alert.alert("تنبيه", "الرجاء اختيار سائق أولاً");
      return;
    }

    const price = parseFloat(offerPrice);
    const minutes = parseInt(offerMinutes);

    if (isNaN(price) || price < 3) {
      Alert.alert("تنبيه", "الرجاء إدخال سعر صالح (3 شيكل على الأقل)");
      return;
    }

    if (isNaN(minutes) || minutes < 1) {
      Alert.alert("تنبيه", "الرجاء إدخال وقت مقدر صالح");
      return;
    }

    setSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // إرسال العرض للسائق
    const bid: DriverOffer = {
      driverId: selectedDriver.id,
      driverName: selectedDriver.driverName || selectedDriver.fullName,
      driverPhone: selectedDriver.phone,
      driverRating: selectedDriver.rating || 4.5,
      totalDeliveries: selectedDriver.totalDeliveries || 0,
      vehicleType: selectedDriver.vehicleType || "car",
      price: price,
      estimatedMinutes: minutes,
    };

    // تحديث حالة طلب الشركة مع معلومات السائق
    if (storeOrder) {
      updateOrderStatus(storeOrder.id, "accepted", {
        driverInfo: {
          driverId: selectedDriver.id,
          driverName: selectedDriver.driverName || selectedDriver.fullName,
          driverPhone: selectedDriver.phone,
          estimatedMinutes: minutes,
          vehicleType: selectedDriver.vehicleType || "car",
        }
      });
    }

    setSubmitting(false);
    
    Alert.alert(
      "✅ تم تعيين السائق",
      `تم إرسال الطلب إلى السائق ${selectedDriver.driverName}. سيتم التواصل مع العميل.`,
      [{ text: "حسناً", onPress: () => router.back() }]
    );
  };

  if (!storeOrder) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={{ color: colors.textGray }}>الطلب غير موجود</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primary }]}>
            <Text style={{ color: "#fff" }}>رجوع</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#FF6584", paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تعيين سائق</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* معلومات الطلب */}
        <View style={[styles.orderInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.orderInfoTitle, { color: colors.foreground }]}>معلومات الطلب</Text>
          <Text style={[styles.orderId, { color: colors.primary }]}>#{storeOrder.id.slice(-8)}</Text>
          <Text style={[styles.customerName, { color: colors.foreground }]}>{storeOrder.customerName}</Text>
          <Text style={[styles.customerPhone, { color: colors.textGray }]}>{storeOrder.customerPhone}</Text>
          <View style={styles.addressBox}>
            <Feather name="map-pin" size={14} color={colors.primary} />
            <Text style={[styles.addressText, { color: colors.textGray }]}>{storeOrder.deliveryAddress}</Text>
          </View>
          <Text style={[styles.totalPrice, { color: colors.primary }]}>المبلغ: {storeOrder.totalPrice} ₪</Text>
        </View>

        {/* أزرار الترتيب */}
        <View style={styles.sortBar}>
          <Text style={[styles.sortLabel, { color: colors.textGray }]}>ترتيب حسب:</Text>
          <TouchableOpacity
            style={[styles.sortBtn, sortType === 'rating' && { backgroundColor: colors.primary }]}
            onPress={() => setSortType('rating')}
          >
            <Feather name="star" size={14} color={sortType === 'rating' ? '#fff' : colors.textGray} />
            <Text style={[styles.sortText, { color: sortType === 'rating' ? '#fff' : colors.textGray }]}>الأعلى تقييماً</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sortBtn, sortType === 'distance' && { backgroundColor: colors.primary }]}
            onPress={() => setSortType('distance')}
          >
            <Feather name="navigation" size={14} color={sortType === 'distance' ? '#fff' : colors.textGray} />
            <Text style={[styles.sortText, { color: sortType === 'distance' ? '#fff' : colors.textGray }]}>الأقرب</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sortBtn, sortType === 'price' && { backgroundColor: colors.primary }]}
            onPress={() => setSortType('price')}
          >
            <Feather name="tag" size={14} color={sortType === 'price' ? '#fff' : colors.textGray} />
            <Text style={[styles.sortText, { color: sortType === 'price' ? '#fff' : colors.textGray }]}>الأقل سعراً</Text>
          </TouchableOpacity>
        </View>

        {/* قائمة السائقين */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>اختر سائقاً</Text>
        
        {getSortedDrivers().length === 0 ? (
          <View style={[styles.emptyDrivers, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="truck" size={48} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textGray }]}>لا يوجد سائقين متاحين حالياً</Text>
          </View>
        ) : (
          getSortedDrivers().map((driver) => {
            const isSelected = selectedDriver?.id === driver.id;
            const isPremium = (driver.rating || 0) >= 4.8;
            
            return (
              <TouchableOpacity
                key={driver.id}
                style={[
                  styles.driverCard,
                  {
                    backgroundColor: isSelected ? colors.primary + "10" : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => handleSelectDriver(driver)}
              >
                {/* صورة السائق مع شارة متميز */}
                <View style={styles.driverAvatarContainer}>
                  <View style={[styles.driverAvatar, { backgroundColor: isPremium ? "#FFD70020" : colors.primary + "20" }]}>
                    <Text style={[styles.driverInitial, { color: isPremium ? "#FF8C00" : colors.primary }]}>
                      {driver.driverName?.charAt(0) || driver.fullName?.charAt(0) || "س"}
                    </Text>
                  </View>
                  {isPremium && (
                    <View style={styles.premiumBadge}>
                      <Feather name="award" size={12} color="#FFD700" />
                    </View>
                  )}
                </View>

                {/* معلومات السائق */}
                <View style={styles.driverInfo}>
                  <View style={styles.driverNameRow}>
                    <Text style={[styles.driverName, { color: colors.foreground }]}>
                      {driver.driverName || driver.fullName}
                    </Text>
                    {isPremium && (
                      <View style={styles.premiumTag}>
                        <Text style={styles.premiumTagText}>متميز</Text>
                      </View>
                    )}
                  </View>

                  {/* التقييم */}
                  <View style={styles.ratingRow}>
                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Feather
                          key={star}
                          name={star <= Math.floor(driver.rating || 0) ? "star" : "star"}
                          size={12}
                          color={star <= (driver.rating || 0) ? "#FFB800" : colors.textLight}
                        />
                      ))}
                    </View>
                    <Text style={[styles.ratingValue, { color: colors.textGray }]}>
                      {driver.rating} • {driver.totalDeliveries} توصيلة
                    </Text>
                  </View>

                  {/* المسافة والوقت */}
                  <View style={styles.driverStats}>
                    <View style={styles.statChip}>
                      <Feather name="map-pin" size={10} color={colors.textGray} />
                      <Text style={[styles.statText, { color: colors.textGray }]}>
                        {driver.distance} كم
                      </Text>
                    </View>
                    <View style={styles.statChip}>
                      <Feather name="clock" size={10} color={colors.textGray} />
                      <Text style={[styles.statText, { color: colors.textGray }]}>
                        {driver.estimatedTime} دقيقة
                      </Text>
                    </View>
                    <View style={styles.statChip}>
                      <Feather name="truck" size={10} color={colors.textGray} />
                      <Text style={[styles.statText, { color: colors.textGray }]}>
                        {driver.vehicleType === "car" ? "سيارة" : driver.vehicleType === "bike" ? "بسكليت" : "نقل"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* السعر المقترح */}
                <View style={styles.priceSection}>
                  <Text style={[styles.priceLabel, { color: colors.textGray }]}>مقترح</Text>
                  <Text style={[styles.suggestedPrice, { color: colors.primary }]}>
                    {driver.suggestedPrice} ₪
                  </Text>
                  {isSelected && (
                    <Feather name="check-circle" size={20} color={colors.primary} style={styles.checkIcon} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* نموذج تقديم العرض */}
        {selectedDriver && (
          <View style={[styles.offerForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.offerTitle, { color: colors.foreground }]}>تقديم عرض للسائق</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textGray }]}>💰 السعر المقترح (شيكل)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder="مثال: 15"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
                value={offerPrice}
                onChangeText={setOfferPrice}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textGray }]}>⏰ الوقت المتوقع (دقائق)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder="مثال: 10"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
                value={offerMinutes}
                onChangeText={setOfferMinutes}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.secondary, opacity: submitting ? 0.7 : 1 }]}
              onPress={handleSubmitOffer}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="send" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>إرسال العرض وتعيين السائق</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  container: { padding: 16, gap: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  
  orderInfo: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  orderInfoTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  orderId: { fontSize: 12, fontWeight: "700" },
  customerName: { fontSize: 14, fontWeight: "600" },
  customerPhone: { fontSize: 12 },
  addressBox: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  addressText: { fontSize: 12, flex: 1 },
  totalPrice: { fontSize: 16, fontWeight: "800", marginTop: 4 },
  
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  
  // Sort bar styles
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  sortText: {
    fontSize: 11,
    fontWeight: '500',
  },
  
  emptyDrivers: { alignItems: "center", justifyContent: "center", paddingVertical: 40, borderRadius: 14, borderWidth: 1, gap: 12 },
  emptyText: { fontSize: 14 },
  
  // Driver card styles
  driverCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  driverAvatarContainer: {
    position: 'relative',
  },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  driverInitial: { fontSize: 20, fontWeight: "700" },
  premiumBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
  driverInfo: { flex: 1 },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  driverName: { fontSize: 15, fontWeight: "700" },
  premiumTag: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  premiumTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingValue: {
    fontSize: 10,
  },
  driverStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statText: {
    fontSize: 9,
  },
  priceSection: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  priceLabel: {
    fontSize: 9,
  },
  suggestedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkIcon: {
    marginTop: 4,
  },
  
  offerForm: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  offerTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});