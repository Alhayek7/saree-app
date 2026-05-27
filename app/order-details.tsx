// app/(driver)/order-details.tsx
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DriverOrderDetailsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { user } = useAuth();
  const { getOrderById, updateDriverStatus, rejectOrderByDriver, updateOrderByDriver } = useOrders();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (orderId) {
      const foundOrder = getOrderById(orderId);
      setOrder(foundOrder || null);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [orderId]);

  // ✅ قبول الطلب - مع التحقق من وجود order
  const handleAcceptOrder = async () => {
    if (!order || !user) {
      Alert.alert("خطأ", "الطلب أو المستخدم غير موجود");
      return;
    }
    
    setSubmitting(true);
    updateOrderByDriver(order.id, user.id, 'accept');
    
    setTimeout(() => {
      Alert.alert(
        "✅ تم قبول الطلب",
        "تم قبول الطلب بنجاح. يمكنك البدء في التوصيل.",
        [{ text: "حسناً", onPress: () => router.back() }]
      );
      setSubmitting(false);
    }, 500);
  };

  // ✅ رفض الطلب - مع التحقق من وجود order
  const handleRejectOrder = () => {
    if (!order || !user) {
      Alert.alert("خطأ", "الطلب أو المستخدم غير موجود");
      return;
    }
    
    Alert.alert(
      "❌ رفض الطلب",
      "هل أنت متأكد من رفض هذا الطلب؟",
      [
        { text: "إلغاء", style: "cancel" },
        { 
          text: "رفض", 
          style: "destructive",
          onPress: () => {
            updateOrderByDriver(order.id, user.id, 'reject', "السائق مشغول");
            Alert.alert(
              "✅ تم الرفض",
              "تم رفض الطلب. سيبحث العميل عن سائق آخر.",
              [{ text: "حسناً", onPress: () => router.back() }]
            );
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textGray, marginTop: 10 }}>جاري تحميل تفاصيل الطلب...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={48} color={colors.textLight} />
          <Text style={[styles.errorText, { color: colors.textGray }]}>الطلب غير موجود</Text>
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
        <Text style={styles.headerTitle}>تفاصيل الطلب</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* معلومات الطلب */}
        <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📋 معلومات الطلب</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textGray }]}>رقم الطلب:</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>#{order.id?.slice(-8) || "غير معروف"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textGray }]}>العميل:</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{order.customerName || "غير معروف"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textGray }]}>رقم الهاتف:</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{order.customerPhone || "غير معروف"}</Text>
          </View>
        </View>

        {/* موقع الاستلام والتسليم */}
        <View style={[styles.locationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📍 مواقع التوصيل</Text>
          
          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <Feather name="map-pin" size={16} color="#28A745" />
            </View>
            <View style={styles.locationContent}>
              <Text style={[styles.locationLabel, { color: colors.textGray }]}>موقع الاستلام:</Text>
              <Text style={[styles.locationAddress, { color: colors.foreground }]}>{order.pickupAddress || "غير محدد"}</Text>
            </View>
          </View>

          <View style={styles.locationDivider} />

          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <Feather name="flag" size={16} color="#DC3545" />
            </View>
            <View style={styles.locationContent}>
              <Text style={[styles.locationLabel, { color: colors.textGray }]}>موقع التسليم:</Text>
              <Text style={[styles.locationAddress, { color: colors.foreground }]}>{order.deliveryAddress}</Text>
            </View>
          </View>
        </View>

        {/* تفاصيل الطرد */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📦 تفاصيل الطرد</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textGray }]}>الوزن:</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>خفيف</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textGray }]}>نوع المركبة:</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {order.vehicleType === "car" ? "🚗 سيارة" : order.vehicleType === "bike" ? "🛵 بسكليت" : "🚚 نقل"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textGray }]}>طريقة الدفع:</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {order.paymentMethod === "cash" ? "💰 كاش" : "💳 إلكتروني"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textGray }]}>المبلغ:</Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}>{order.finalPrice || order.selectedOffer?.price || 0} ₪</Text>
          </View>
        </View>

        {/* أزرار الإجراءات */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: colors.secondary, opacity: submitting ? 0.7 : 1 }]}
            onPress={handleAcceptOrder}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="check-circle" size={20} color="#fff" />
                <Text style={styles.acceptBtnText}>قبول الطلب</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rejectBtn, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive }]}
            onPress={handleRejectOrder}
          >
            <Feather name="x-circle" size={20} color={colors.destructive} />
            <Text style={[styles.rejectBtnText, { color: colors.destructive }]}>رفض الطلب</Text>
          </TouchableOpacity>
        </View>
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
  errorText: { fontSize: 16, fontWeight: "500" },

  orderCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  locationCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  detailsCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoLabel: { fontSize: 13, fontWeight: "600" },
  infoValue: { fontSize: 13 },
  priceValue: { fontSize: 18, fontWeight: "800" },
  
  locationRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  locationIcon: { width: 24, alignItems: "center", marginTop: 2 },
  locationContent: { flex: 1 },
  locationLabel: { fontSize: 11, marginBottom: 2 },
  locationAddress: { fontSize: 13, lineHeight: 18 },
  locationDivider: { height: 1, backgroundColor: "#E5E5E5", marginVertical: 8 },
  
  actionsContainer: { gap: 12, marginTop: 8 },
  acceptBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  acceptBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  rejectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  rejectBtnText: { fontSize: 16, fontWeight: "700" },
});