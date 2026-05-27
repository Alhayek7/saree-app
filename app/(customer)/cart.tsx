// app/(customer)/cart.tsx
import { useCart } from "@/context/CartContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CartScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    getItemsByStore, 
    getTotalItems, 
    getTotalPrice, 
    getStoreCount, 
    clearCart 
  } = useCart();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const groupedItems = getItemsByStore();
  const storeIds = Object.keys(groupedItems);

const handleCheckout = () => {
  router.push("/cutomer_payment-proof");
};

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPad + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-right" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>سلة المشتريات</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="shopping-cart" size={64} color={colors.textLight} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>سلة فارغة</Text>
          <Text style={[styles.emptySub, { color: colors.textGray }]}>أضف منتجات إلى سلتك</Text>
          <TouchableOpacity
            style={[styles.shopBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
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
        <Text style={styles.headerTitle}>سلة المشتريات</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>مسح الكل</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={storeIds}
        keyExtractor={(storeId) => storeId}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: storeId }) => {
          const storeItems = groupedItems[storeId];
          const storeName = storeItems[0]?.storeName || "متجر";
          const storeTotal = storeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          
          return (
            <View style={[styles.storeSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.storeHeader}>
                <Feather name="shopping-bag" size={16} color={colors.primary} />
                <Text style={[styles.storeName, { color: colors.foreground }]}>{storeName}</Text>
                <Text style={[styles.storeTotal, { color: colors.primary }]}>{storeTotal} ₪</Text>
              </View>

              {storeItems.map((item) => (
                <View key={item.id} style={styles.cartItem}>
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemPrice, { color: colors.primary }]}>{item.price} ₪</Text>
                  </View>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={[styles.qtyBtn, { backgroundColor: colors.muted }]}
                      onPress={() => {
                        updateQuantity(item.id, item.quantity - 1);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Feather name="minus" size={14} color={colors.foreground} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyText, { color: colors.foreground }]}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={[styles.qtyBtn, { backgroundColor: colors.muted }]}
                      onPress={() => {
                        updateQuantity(item.id, item.quantity + 1);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Feather name="plus" size={14} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity 
                    onPress={() => {
                      removeFromCart(item.id);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    }}
                  >
                    <Feather name="trash-2" size={18} color="#DC3545" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        }}
      />

      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.textGray }]}>الإجمالي</Text>
          <Text style={[styles.totalPrice, { color: colors.primary }]}>{getTotalPrice} ₪</Text>
        </View>
        <View style={styles.itemsCount}>
          <Text style={[styles.itemsCountText, { color: colors.textGray }]}>{getTotalItems} منتجات</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: colors.secondary }]}
          onPress={handleCheckout}
        >
          <Feather name="check-circle" size={18} color="#fff" />
          <Text style={styles.checkoutText}>إتمام الشراء</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 16, 
    paddingBottom: 16 
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  clearText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center" },
  shopBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  shopBtnText: { color: "#fff", fontWeight: "700" },
  storeSection: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  storeHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 12, 
    gap: 8, 
    borderBottomWidth: 1, 
    borderBottomColor: "#E5E5E5" 
  },
  storeName: { flex: 1, fontSize: 14, fontWeight: "700" },
  storeTotal: { fontSize: 14, fontWeight: "800" },
  cartItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  itemImage: { width: 50, height: 50, borderRadius: 8 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: "600" },
  itemPrice: { fontSize: 12, marginTop: 2 },
  quantityControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  qtyText: { fontSize: 14, fontWeight: "700", minWidth: 24, textAlign: "center" },

  bottomBar: { padding: 16, borderTopWidth: 1, gap: 8, paddingBottom: 10 },

totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 14 },
  totalPrice: { fontSize: 22, fontWeight: "800" },
  itemsCount: { alignItems: "flex-end" },
  itemsCountText: { fontSize: 12 },
checkoutBtn: { 
  flexDirection: "row", 
  alignItems: "center", 
  justifyContent: "center", 
  gap: 8, 
  paddingVertical: 14, 
  borderRadius: 14,
  marginBottom: 40,  // ✅ أضف هذا
},
  checkoutText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});