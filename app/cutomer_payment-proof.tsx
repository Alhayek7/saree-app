// app/(customer)/payment-proof.tsx
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useStoreOrder } from "@/context/StoreOrderContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
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

interface StorePayment {
  storeId: string;
  storeName: string;
  bankAccount: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    iban?: string;
  };
  totalAmount: number;
  imageUri?: string;
}

export default function PaymentProofScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { items, getItemsByStore, getTotalPrice, clearCart } = useCart();
  const { createOrder, addPaymentProof } = useStoreOrder();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [deliveryAddress, setDeliveryAddress] = useState(user?.neighborhood || "");
  const [paymentProofs, setPaymentProofs] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const groupedItems = getItemsByStore();
  const storeIds = Object.keys(groupedItems);
  const totalPrice = getTotalPrice;
  const deliveryFee = 5;
  const finalTotal = totalPrice + deliveryFee;

  // بيانات بنكية تجريبية للمتاجر
  const storeBankAccounts: Record<string, any> = {
    "store_owner_001": {
      bankName: "بنك فلسطين",
      accountName: "متجر الأمل للتجارة",
      accountNumber: "123456789",
      iban: "PS98PALS123456789012345678901",
    },
    "store_owner_002": {
      bankName: "بنك القدس",
      accountName: "متجر السلام",
      accountNumber: "987654321",
      iban: "PS98QUDS987654321098765432109",
    },
  };

  const pickImage = async (storeId: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("تنبيه", "نحتاج إلى إذن الوصول إلى المعرض");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setPaymentProofs(prev => ({ ...prev, [storeId]: result.assets[0].uri }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSubmitOrders = async () => {
    if (!deliveryAddress.trim()) {
      Alert.alert("تنبيه", "الرجاء إدخال عنوان التسليم");
      return;
    }

    // التحقق من رفع إثبات الدفع لكل متجر
    const missingProofs = storeIds.filter(id => !paymentProofs[id]);
    if (missingProofs.length > 0) {
      Alert.alert("تنبيه", `الرجاء رفع إثبات الدفع للمتاجر التالية: ${missingProofs.map(id => groupedItems[id][0]?.storeName).join(", ")}`);
      return;
    }

    setSubmitting(true);

    // إنشاء طلب لكل متجر
    for (const storeId of storeIds) {
      const storeItems = groupedItems[storeId];
      const storeName = storeItems[0]?.storeName || "متجر";
      const storeTotal = storeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      
      const order = createOrder({
        storeId,
        storeName,
        customerId: user!.id,
        customerName: user!.fullName || "عميل",
        customerPhone: user!.phone || "",
        deliveryAddress: deliveryAddress.trim(),
        items: storeItems.map(i => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
        totalPrice: storeTotal,
      });

      addPaymentProof(order.id, paymentProofs[storeId]);
    }

    clearCart();
    setSubmitting(false);
    
    Alert.alert(
      "✅ تم إرسال الطلبات",
      "تم إرسال طلباتك بنجاح. سيتم مراجعتها من قبل المتاجر.",
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
          <Text style={styles.headerTitle}>رفع إثبات الدفع</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="shopping-cart" size={64} color={colors.textLight} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد منتجات</Text>
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
        <Text style={styles.headerTitle}>رفع إثبات الدفع</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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

        {/* تفاصيل الدفع لكل متجر */}
        {storeIds.map((storeId) => {
          const storeItems = groupedItems[storeId];
          const storeName = storeItems[0]?.storeName || "متجر";
          const storeTotal = storeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          const bankAccount = storeBankAccounts[storeId] || storeBankAccounts["store_owner_001"];
          
          return (
            <View key={storeId} style={[styles.storeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.storeName, { color: colors.primary }]}>{storeName}</Text>
              
              {/* معلومات الحساب البنكي */}
              <View style={[styles.bankInfo, { backgroundColor: colors.muted }]}>
                <Text style={[styles.bankTitle, { color: colors.foreground }]}>🏦 معلومات الحساب البنكي</Text>
                <Text style={[styles.bankText, { color: colors.textGray }]}>البنك: {bankAccount.bankName}</Text>
                <Text style={[styles.bankText, { color: colors.textGray }]}>اسم الحساب: {bankAccount.accountName}</Text>
                <Text style={[styles.bankText, { color: colors.textGray }]}>رقم الحساب: {bankAccount.accountNumber}</Text>
                {bankAccount.iban && (
                  <Text style={[styles.bankText, { color: colors.textGray }]}>IBAN: {bankAccount.iban}</Text>
                )}
              </View>

              {/* قائمة المنتجات */}
              <Text style={[styles.productsTitle, { color: colors.foreground }]}>المنتجات:</Text>
              {storeItems.map((item) => (
                <View key={item.id} style={styles.productRow}>
                  <Text style={[styles.productName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.productQty, { color: colors.textGray }]}>x{item.quantity}</Text>
                  <Text style={[styles.productPrice, { color: colors.primary }]}>{item.price * item.quantity} ₪</Text>
                </View>
              ))}
              
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textGray }]}>إجمالي المتجر:</Text>
                <Text style={[styles.totalAmount, { color: colors.primary }]}>{storeTotal} ₪</Text>
              </View>

              {/* رفع إثبات الدفع */}
              <View style={styles.proofSection}>
                <Text style={[styles.proofTitle, { color: colors.foreground }]}>📎 إثبات الدفع</Text>
                {paymentProofs[storeId] ? (
                  <View style={styles.proofPreview}>
                    <Image source={{ uri: paymentProofs[storeId] }} style={styles.proofImage} />
                    <TouchableOpacity
                      style={[styles.reuploadBtn, { backgroundColor: colors.muted }]}
                      onPress={() => pickImage(storeId)}
                    >
                      <Feather name="refresh-cw" size={14} color={colors.primary} />
                      <Text style={[styles.reuploadText, { color: colors.primary }]}>إعادة رفع</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.uploadBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
                    onPress={() => pickImage(storeId)}
                  >
                    <Feather name="upload" size={20} color={colors.primary} />
                    <Text style={[styles.uploadText, { color: colors.primary }]}>رفع صورة التحويل</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {/* الملخص النهائي */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.foreground }]}>💰 ملخص الدفع</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>المجموع</Text>
            <Text style={styles.summaryValue}>{totalPrice} ₪</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>رسوم التوصيل</Text>
            <Text style={styles.summaryValue}>{deliveryFee} ₪</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryTotalLabel, { color: colors.foreground }]}>الإجمالي</Text>
            <Text style={[styles.summaryTotalValue, { color: colors.primary }]}>{finalTotal} ₪</Text>
          </View>
        </View>
      </ScrollView>

      {/* زر تأكيد الطلب */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.secondary, opacity: submitting ? 0.7 : 1 }]}
          onPress={handleSubmitOrders}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>تأكيد وإرسال الطلبات</Text>
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
  
  addressCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  addressInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  
  storeCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  storeName: { fontSize: 16, fontWeight: "700" },
  
  bankInfo: { borderRadius: 10, padding: 12, gap: 4 },
  bankTitle: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  bankText: { fontSize: 12 },
  
  productsTitle: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  productRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  productName: { fontSize: 13, flex: 1 },
  productQty: { fontSize: 12, marginHorizontal: 8 },
  productPrice: { fontSize: 13, fontWeight: "600" },
  
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#E5E5E5" },
  totalLabel: { fontSize: 13 },
  totalAmount: { fontSize: 16, fontWeight: "800" },
  
  proofSection: { gap: 8, marginTop: 4 },
  proofTitle: { fontSize: 13, fontWeight: "600" },
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  uploadText: { fontSize: 14, fontWeight: "600" },
  proofPreview: { alignItems: "center", gap: 8 },
  proofImage: { width: "100%", height: 150, borderRadius: 10 },
  reuploadBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  reuploadText: { fontSize: 12, fontWeight: "600" },
  
  summaryCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  summaryTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 13, color: "#666" },
  summaryValue: { fontSize: 13, fontWeight: "600" },
  summaryDivider: { height: 1, backgroundColor: "#E5E5E5", marginVertical: 6 },
  summaryTotalLabel: { fontSize: 15, fontWeight: "700" },
  summaryTotalValue: { fontSize: 18, fontWeight: "800", color: "#28A745" },
  
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  shopBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  shopBtnText: { color: "#fff", fontWeight: "700" },
  
  bottomBar: { padding: 16, borderTopWidth: 1 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});