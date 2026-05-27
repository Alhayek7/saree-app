// app/(customer)/store-products.tsx
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image?: string;
  isActive: boolean;
  category?: string;
  stock?: number;
  storeOwnerId?: string;
  storeName?: string;
}

// بيانات تجريبية للمنتجات
const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "قميص قطني",
    price: 49,
    description: "قميص قطني 100%، مقاسات متعددة، ألوان مختلفة - مثالي للارتداء اليومي",
    image: "https://picsum.photos/200/150?random=1",
    isActive: true,
    category: "ملابس",
    stock: 50,
    storeOwnerId: "store_owner_001",
    storeName: "متجر الأمل",
  },
  {
    id: "2",
    name: "حذاء رياضي",
    price: 129,
    description: "حذاء رياضي مريح للجري والمشي اليومي، نعل مطاطي مقاوم للانزلاق",
    image: "https://picsum.photos/200/150?random=2",
    isActive: true,
    category: "أحذية",
    stock: 30,
    storeOwnerId: "store_owner_001",
    storeName: "متجر الأمل",
  },
  {
    id: "3",
    name: "ساعة يد ذكية",
    price: 299,
    description: "ساعة ذكية متعددة الوظائف، مقاومة للماء، تدعم الاتصال بالهاتف",
    image: "https://picsum.photos/200/150?random=3",
    isActive: true,
    category: "إلكترونيات",
    stock: 15,
    storeOwnerId: "store_owner_002",
    storeName: "متجر السلام",
  },
  {
    id: "4",
    name: "حقيبة ظهر",
    price: 89,
    description: "حقيبة ظهر عملية ومتينة، مناسبة للاستخدام اليومي والسفر",
    image: "https://picsum.photos/200/150?random=4",
    isActive: true,
    category: "إكسسوارات",
    stock: 25,
    storeOwnerId: "store_owner_001",
    storeName: "متجر الأمل",
  },
];

export default function StoreProductsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const { createOrder } = useOrders();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "electronic">("cash");
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      // استخدام بيانات تجريبية
      setProducts(MOCK_PRODUCTS.filter(p => p.isActive));
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts().then(() => setRefreshing(false));
  };

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setDeliveryAddress(user?.neighborhood || "");
    setPaymentMethod("cash");
    setModalVisible(true);
  };

  const increaseQuantity = () => {
    if (selectedProduct && quantity < (selectedProduct.stock || 99)) {
      setQuantity(quantity + 1);
      Haptics.selectionAsync();
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
      Haptics.selectionAsync();
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedProduct) return 0;
    return selectedProduct.price * quantity;
  };

  const handleOrderProduct = async () => {
    if (!selectedProduct) return;
    if (!user) {
      Alert.alert("تنبيه", "الرجاء تسجيل الدخول أولاً");
      return;
    }
    if (!deliveryAddress.trim()) {
      Alert.alert("تنبيه", "الرجاء إدخال عنوان التسليم");
      return;
    }

    setOrdering(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const totalPrice = calculateTotalPrice();
    const orderDescription = `${selectedProduct.name} x ${quantity} قطعة - ${selectedProduct.storeName}`;

    const order = createOrder({
      customerId: user.id,
      pickupAddress: `متجر ${selectedProduct.storeName} - استلام المنتج`,
      deliveryAddress: deliveryAddress.trim(),
      packageDescription: orderDescription,
      vehicleType: "car",
      paymentMethod: paymentMethod,
    });

    setOrdering(false);
    setModalVisible(false);
    
    Alert.alert(
      "✅ تم الطلب",
      `تم إرسال طلب شراء "${selectedProduct.name}" (${quantity} قطعة) بمبلغ ${totalPrice} ₪ بنجاح.\nسيتم التواصل معك قريباً للتوصيل إلى: ${deliveryAddress}`,
      [{ text: "حسناً", onPress: () => router.back() }]
    );
  };

  // استخراج الفئات
  const categories = ["all", ...new Set(products.map(p => p.category).filter(Boolean))] as string[];
  
  // فلترة المنتجات
  const filteredProducts = products.filter(product => {
    if (selectedCategory !== "all" && product.category !== selectedCategory) return false;
    if (searchQuery) {
      return product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.productPrice, { color: colors.primary }]}>{item.price} ₪</Text>
        </View>
        <Text style={[styles.productDesc, { color: colors.textGray }]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.productFooter}>
          <View style={[styles.storeBadge, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="shopping-bag" size={10} color={colors.primary} />
            <Text style={[styles.storeName, { color: colors.primary }]}>{item.storeName}</Text>
          </View>
          {item.stock !== undefined && (
            <Text style={[styles.stockText, { color: item.stock > 0 ? "#28A745" : "#DC3545" }]}>
              {item.stock > 0 ? `📦 متوفر: ${item.stock}` : "❌ نفد"}
            </Text>
          )}
        </View>
      </View>
{isInCart(item.id, item.storeOwnerId || "store") ? (
  <View style={[styles.inCartBadge, { backgroundColor: colors.primary + "20" }]}>
    <Feather name="check" size={14} color={colors.primary} />
    <Text style={[styles.inCartText, { color: colors.primary }]}>في السلة</Text>
  </View>
) : (
  <TouchableOpacity
    style={[styles.addToCartBtn, { backgroundColor: colors.secondary }]}
    onPress={() => {
      addToCart({
        productId: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        storeId: item.storeOwnerId || "store",
        storeName: item.storeName || "متجر",
        stock: item.stock,
      });
      Alert.alert("✅ تم الإضافة", `تم إضافة ${item.name} إلى السلة`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }}
  >
    <Feather name="shopping-cart" size={14} color="#fff" />
    <Text style={styles.addToCartText}>أضف</Text>
  </TouchableOpacity>
)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#FF6584", paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>منتجات المتاجر</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={18} color={colors.textGray} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="ابحث عن منتج..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== "" && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Feather name="x" size={18} color={colors.textGray} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        <View style={styles.categoriesContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === cat ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, { color: selectedCategory === cat ? "#fff" : colors.textGray }]}>
                {cat === "all" ? "الكل" : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="package" size={48} color={colors.textLight} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد منتجات</Text>
            <Text style={[styles.emptySub, { color: colors.textGray }]}>
              {searchQuery ? "لا توجد نتائج مطابقة للبحث" : "لا توجد منتجات متاحة حالياً"}
            </Text>
          </View>
        }
        renderItem={renderProductCard}
      />

      {/* Order Modal - محسن */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>طلب المنتج</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={colors.textGray} />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Product Image */}
                <Image source={{ uri: selectedProduct.image }} style={styles.modalImage} />
                
                {/* Product Name & Price */}
                <Text style={[styles.modalProductName, { color: colors.foreground }]}>{selectedProduct.name}</Text>
                <Text style={[styles.modalProductPrice, { color: colors.primary }]}>{selectedProduct.price} ₪</Text>
                
                {/* Store Name */}
                <View style={[styles.modalStoreBadge, { backgroundColor: colors.primary + "10" }]}>
                  <Feather name="shopping-bag" size={14} color={colors.primary} />
                  <Text style={[styles.modalStoreName, { color: colors.primary }]}>{selectedProduct.storeName}</Text>
                </View>

                {/* Product Description */}
                <Text style={[styles.modalSectionTitle, { color: colors.foreground }]}>📝 وصف المنتج</Text>
                <Text style={[styles.modalDescription, { color: colors.textGray }]}>{selectedProduct.description}</Text>

                {/* Quantity Selector */}
                <Text style={[styles.modalSectionTitle, { color: colors.foreground }]}>🔢 الكمية</Text>
                <View style={styles.quantitySelector}>
                  <TouchableOpacity
                    style={[styles.quantityBtn, { backgroundColor: colors.muted }]}
                    onPress={decreaseQuantity}
                    disabled={quantity <= 1}
                  >
                    <Feather name="minus" size={18} color={colors.foreground} />
                  </TouchableOpacity>
                  <Text style={[styles.quantityText, { color: colors.foreground }]}>{quantity}</Text>
                  <TouchableOpacity
                    style={[styles.quantityBtn, { backgroundColor: colors.muted }]}
                    onPress={increaseQuantity}
                    disabled={selectedProduct.stock ? quantity >= selectedProduct.stock : false}
                  >
                    <Feather name="plus" size={18} color={colors.foreground} />
                  </TouchableOpacity>
                  <Text style={[styles.stockInfo, { color: colors.textLight }]}>
                    {selectedProduct.stock ? `المتبقي: ${selectedProduct.stock}` : ""}
                  </Text>
                </View>

                {/* Delivery Address */}
                <Text style={[styles.modalSectionTitle, { color: colors.foreground }]}>📍 عنوان التسليم</Text>
                <TextInput
                  style={[styles.addressInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="أدخل عنوان التسليم بالكامل"
                  placeholderTextColor={colors.textLight}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                />

                {/* Payment Method */}
                <Text style={[styles.modalSectionTitle, { color: colors.foreground }]}>💳 طريقة الدفع</Text>
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
                    <Text style={{ fontSize: 24 }}>💵</Text>
                    <Text style={[styles.paymentText, { color: paymentMethod === "cash" ? colors.primary : colors.textGray }]}>نقداً</Text>
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
                    <Text style={{ fontSize: 24 }}>💳</Text>
                    <Text style={[styles.paymentText, { color: paymentMethod === "electronic" ? colors.primary : colors.textGray }]}>إلكتروني</Text>
                  </TouchableOpacity>
                </View>

                {/* Order Summary */}
                <View style={[styles.orderSummary, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.summaryTitle, { color: colors.foreground }]}>🧾 ملخص الطلب</Text>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textGray }]}>المنتج</Text>
                    <Text style={[styles.summaryValue, { color: colors.foreground }]}>{selectedProduct.name}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textGray }]}>الكمية</Text>
                    <Text style={[styles.summaryValue, { color: colors.foreground }]}>{quantity}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textGray }]}>السعر للقطعة</Text>
                    <Text style={[styles.summaryValue, { color: colors.foreground }]}>{selectedProduct.price} ₪</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryTotalLabel, { color: colors.foreground }]}>الإجمالي</Text>
                    <Text style={[styles.summaryTotalValue, { color: colors.primary }]}>{calculateTotalPrice()} ₪</Text>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Order Button */}
            <TouchableOpacity
              style={[styles.orderNowBtn, { backgroundColor: colors.secondary, opacity: ordering ? 0.7 : 1 }]}
              onPress={handleOrderProduct}
              disabled={ordering}
            >
              {ordering ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="check-circle" size={18} color="#fff" />
                  <Text style={styles.orderNowText}>تأكيد الطلب</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  
  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 4 },
headerTitle: {
  color: "#fff",
  fontSize: 18,
  fontWeight: "700",
  flex: 1,
  textAlign: "center",
},  
  // Search
  searchContainer: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  
  // Categories
  categoriesScroll: { flexGrow: 0 },
  categoriesContainer: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, gap: 10 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  categoryText: { fontSize: 13, fontWeight: "600" },
  
  // Product Card
  productCard: { flexDirection: "row", borderRadius: 16, borderWidth: 1, padding: 12, gap: 12, marginHorizontal: 16, marginBottom: 12 },
  productImage: { width: 80, height: 80, borderRadius: 12 },
  productInfo: { flex: 1, gap: 4 },
  productHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  productName: { fontSize: 14, fontWeight: "700", flex: 1 },
  productPrice: { fontSize: 14, fontWeight: "800" },
  productDesc: { fontSize: 11, lineHeight: 14 },
  productFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  storeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  storeName: { fontSize: 9, fontWeight: "600" },
  stockText: { fontSize: 9 },
  orderBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  
  // Empty State
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center" },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 16 },
  modalContainer: { borderRadius: 20, maxHeight: "85%", overflow: "hidden" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E5E5E5" },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalBody: { padding: 16, gap: 12 },
  modalImage: { width: "100%", height: 180, borderRadius: 12, marginBottom: 8 },
  modalProductName: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  modalProductPrice: { fontSize: 22, fontWeight: "800", textAlign: "center", marginVertical: 4 },
  modalStoreBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 6, borderRadius: 20, alignSelf: "center", paddingHorizontal: 12 },
  modalStoreName: { fontSize: 13, fontWeight: "600" },
  modalSectionTitle: { fontSize: 14, fontWeight: "700", marginTop: 8, marginBottom: 4 },
  modalDescription: { fontSize: 13, lineHeight: 18 },
  
  // Quantity Selector
  quantitySelector: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 4 },
  quantityBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  quantityText: { fontSize: 18, fontWeight: "700", minWidth: 40, textAlign: "center" },
  stockInfo: { fontSize: 11, marginLeft: 8 },
  
  // Address Input
  addressInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  
  // Payment Options
  paymentOptions: { flexDirection: "row", gap: 12, marginTop: 4 },
  paymentOption: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  paymentText: { fontSize: 14, fontWeight: "600" },
  
  // Order Summary
  orderSummary: { borderRadius: 12, padding: 14, marginTop: 8, gap: 8 },
  summaryTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 12, fontWeight: "600" },
  summaryDivider: { height: 1, marginVertical: 6 },
  summaryTotalLabel: { fontSize: 14, fontWeight: "700" },
  summaryTotalValue: { fontSize: 18, fontWeight: "800" },
  
  // Order Button
  orderNowBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, marginHorizontal: 16, marginBottom: 16, borderRadius: 12 },
  orderNowText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  addToCartBtn: {
  width: 50,
  height: 36,
  borderRadius: 10,
  justifyContent: "center",
  alignItems: "center",
},
addToCartText: {
  color: "#fff",
  fontSize: 12,
  fontWeight: "600",
},
inCartBadge: {
  width: 50,
  height: 36,
  borderRadius: 10,
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "row",
  gap: 4,
},
inCartText: {
  fontSize: 11,
  fontWeight: "600",
},

});