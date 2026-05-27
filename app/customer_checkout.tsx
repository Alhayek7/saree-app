// app/(customer)/checkout.tsx
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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

export default function CheckoutScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const { items, getItemsByStore, getTotalPrice, clearCart } = useCart();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [deliveryAddress, setDeliveryAddress] = useState(user?.neighborhood || "");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "electronic">("cash");
  const [ordering, setOrdering] = useState(false);

  const groupedItems = getItemsByStore();
  const storeIds = Object.keys(groupedItems);
  const totalPrice = getTotalPrice;
  const deliveryFee = 5;
  const finalTotal = totalPrice + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      Alert.alert("تنبيه", "الرجاء إدخال عنوان التسليم");
      return;
    }

    setOrdering(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // إنشاء طلب منفصل لكل متجر
    for (const storeId of storeIds) {
      const storeItems = groupedItems[storeId];
      const storeName = storeItems[0]?.storeName || "متجر";
      const itemsList = storeItems.map(i => `${i.name} x ${i.quantity}`).join(", ");
      
      await createOrder({
        customerId: user!.id,
        pickupAddress: `متجر ${storeName} - استلام المنتجات`,
        deliveryAddress: deliveryAddress.trim(),
        packageDescription: `طلب من ${storeName}: ${itemsList}`,
        vehicleType: "car",
        paymentMethod: paymentMethod,
      });
    }

    clearCart();
    setOrdering(false);
    
    Alert.alert(
      "✅ تم الطلب بنجاح",
      `تم إرسال طلبك بنجاح. سيتم توصيله إلى: ${deliveryAddress}`,
      [{ text: "حسناً", onPress: () => router.replace("/(customer)/orders") }]
    );
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPad + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-right" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الدفع</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="shopping-cart" size={64} color={colors.textLight} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد منتجات</Text>
          <Text style={[styles.emptySub, { color: colors.textGray }]}>أضف منتجات إلى سلتك أولاً</Text>
          <TouchableOpacity
            style={[styles.shopBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(customer)/store-products")}
          >
            <Text style={styles.shopBtnText}>تسوق الآن</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الدفع</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* ملخص الطلب */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.foreground }]}>🛒 ملخص الطلب</Text>
          
          {storeIds.map((storeId) => {
            const storeItems = groupedItems[storeId];
            const storeName = storeItems[0]?.storeName || "متجر";
            return (
              <View key={storeId} style={styles.storeSummary}>
                <Text style={[styles.storeName, { color: colors.primary }]}>{storeName}</Text>
                {storeItems.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                    <View style={styles.itemDetails}>
                      <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.itemQuantity, { color: colors.textGray }]}>الكمية: {item.quantity}</Text>
                    </View>
                    <Text style={[styles.itemPrice, { color: colors.primary }]}>{item.price * item.quantity} ₪</Text>
                  </View>
                ))}
                <View style={styles.storeDivider} />
              </View>
            );
          })}
        </View>

        {/* عنوان التسليم */}
        <View style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📍 عنوان التسليم</Text>
          <TextInput
            style={[styles.addressInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="أدخل عنوان التسليم بالكامل"
            placeholderTextColor={colors.textLight}
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
          />
        </View>

        {/* طريقة الدفع */}
        <View style={[styles.paymentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>💳 طريقة الدفع</Text>
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                {
                  backgroundColor: paymentMethod === "cash" ? colors.primary + "15" : colors.card,
                  borderColor: paymentMethod === "cash" ? colors.primary : colors.border,
                  borderWidth: paymentMethod === "cash" ? 2 : 1,
                },
              ]}
              onPress={() => setPaymentMethod("cash")}
            >
              <Text style={{ fontSize: 28 }}>💵</Text>
              <Text style={[styles.paymentText, { color: paymentMethod === "cash" ? colors.primary : colors.textGray }]}>نقداً</Text>
              <Text style={[styles.paymentDesc, { color: colors.textGray }]}>ادفع للسائق عند الاستلام</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.paymentOption,
                {
                  backgroundColor: paymentMethod === "electronic" ? colors.primary + "15" : colors.card,
                  borderColor: paymentMethod === "electronic" ? colors.primary : colors.border,
                  borderWidth: paymentMethod === "electronic" ? 2 : 1,
                },
              ]}
              onPress={() => setPaymentMethod("electronic")}
            >
              <Text style={{ fontSize: 28 }}>💳</Text>
              <Text style={[styles.paymentText, { color: paymentMethod === "electronic" ? colors.primary : colors.textGray }]}>إلكتروني</Text>
              <Text style={[styles.paymentDesc, { color: colors.textGray }]}>ادفع عبر التطبيق</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* تفاصيل الدفع */}
        <View style={[styles.totalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>💰 تفاصيل الدفع</Text>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textGray }]}>المجموع</Text>
            <Text style={[styles.totalValue, { color: colors.foreground }]}>{totalPrice} ₪</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textGray }]}>رسوم التوصيل</Text>
            <Text style={[styles.totalValue, { color: colors.foreground }]}>{deliveryFee} ₪</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.finalTotalLabel, { color: colors.foreground }]}>الإجمالي</Text>
            <Text style={[styles.finalTotalValue, { color: colors.primary }]}>{finalTotal} ₪</Text>
          </View>
        </View>
      </ScrollView>

      {/* زر تأكيد الطلب */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.orderBtn, { backgroundColor: colors.secondary, opacity: ordering ? 0.7 : 1 }]}
          onPress={handlePlaceOrder}
          disabled={ordering}
        >
          {ordering ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={styles.orderBtnText}>تأكيد الطلب ({finalTotal} ₪)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  container: { padding: 16, paddingBottom: 40, gap: 16 },

  
  // Summary Card
  summaryCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  summaryTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  storeSummary: { gap: 8 },
  storeName: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemImage: { width: 40, height: 40, borderRadius: 8 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: "600" },
  itemQuantity: { fontSize: 11, marginTop: 2 },
  itemPrice: { fontSize: 13, fontWeight: "700" },
  storeDivider: { height: 1, backgroundColor: "#E5E5E5", marginVertical: 8 },
  
  // Address Card
  addressCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  addressInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  
  // Payment Card
  paymentCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  paymentOptions: { flexDirection: "row", gap: 12 },
  paymentOption: { flex: 1, alignItems: "center", padding: 14, borderRadius: 12, gap: 6 },
  paymentText: { fontSize: 14, fontWeight: "700" },
  paymentDesc: { fontSize: 10, textAlign: "center" },
  
  // Total Card
  totalCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 13 },
  totalValue: { fontSize: 13, fontWeight: "600" },
  divider: { height: 1, marginVertical: 6 },
  finalTotalLabel: { fontSize: 15, fontWeight: "700" },
  finalTotalValue: { fontSize: 20, fontWeight: "800" },
  
  // Empty State
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center" },
  shopBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  shopBtnText: { color: "#fff", fontWeight: "700" },
  
  // Bottom Button
bottomBar: { 
  padding: 12, 
  borderTopWidth: 1, 
  paddingBottom: 16,
  marginTop: -100,  // ✅ يرفع الزر للأعلى
},

orderBtn: { 
  flexDirection: "row", 
  alignItems: "center", 
  justifyContent: "center", 
  gap: 8, 
  paddingVertical: 14, 
  borderRadius: 14,
  marginTop: 0,
},  orderBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});