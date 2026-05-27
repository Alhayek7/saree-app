// app/(store-owner)/products.tsx
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
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

// واجهة المنتج
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image?: string;
  isActive: boolean;
  createdAt: number;
  category?: string;
  stock?: number;
  soldCount?: number;
}

const STORAGE_KEY = "@store_products";

// فلاتر المنتجات
type FilterType = "all" | "active" | "inactive";
type SortType = "latest" | "price_asc" | "price_desc" | "name_asc";

export default function StoreProductsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortType, setSortType] = useState<SortType>("latest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImage, setProductImage] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productStock, setProductStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY}_${user?.id}`);
      if (stored) {
        setProducts(JSON.parse(stored));
      } else {
        // منتجات تجريبية
        const mockProducts: Product[] = [
          {
            id: "1",
            name: "قميص قطني",
            price: 49,
            description: "قميص قطني 100%، مقاسات متعددة، ألوان مختلفة - مثالي للارتداء اليومي",
            image: "https://picsum.photos/200/150?random=1",
            isActive: true,
            createdAt: Date.now(),
            category: "ملابس",
            stock: 50,
            soldCount: 12,
          },
          {
            id: "2",
            name: "حذاء رياضي",
            price: 129,
            description: "حذاء رياضي مريح للجري والمشي اليومي، نعل مطاطي مقاوم للانزلاق",
            image: "https://picsum.photos/200/150?random=2",
            isActive: true,
            createdAt: Date.now(),
            category: "أحذية",
            stock: 30,
            soldCount: 8,
          },
          {
            id: "3",
            name: "ساعة يد ذكية",
            price: 299,
            description: "ساعة ذكية متعددة الوظائف، مقاومة للماء، تدعم الاتصال بالهاتف",
            image: "https://picsum.photos/200/150?random=3",
            isActive: true,
            createdAt: Date.now(),
            category: "إلكترونيات",
            stock: 15,
            soldCount: 5,
          },
          {
            id: "4",
            name: "حقيبة ظهر",
            price: 89,
            description: "حقيبة ظهر عملية ومتينة، مناسبة للاستخدام اليومي والسفر",
            image: "https://picsum.photos/200/150?random=4",
            isActive: false,
            createdAt: Date.now(),
            category: "إكسسوارات",
            stock: 0,
            soldCount: 3,
          },
        ];
        setProducts(mockProducts);
        saveProducts(mockProducts);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const saveProducts = async (newProducts: Product[]) => {
    try {
      await AsyncStorage.setItem(`${STORAGE_KEY}_${user?.id}`, JSON.stringify(newProducts));
      setProducts(newProducts);
    } catch (error) {
      console.error("Error saving products:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts().then(() => setRefreshing(false));
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductName("");
    setProductPrice("");
    setProductDescription("");
    setProductImage("");
    setProductCategory("");
    setProductStock("");
    setModalVisible(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductPrice(product.price.toString());
    setProductDescription(product.description);
    setProductImage(product.image || "");
    setProductCategory(product.category || "");
    setProductStock(product.stock?.toString() || "");
    setModalVisible(true);
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      "حذف المنتج",
      `هل أنت متأكد من حذف "${product.name}"؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: () => {
            const newProducts = products.filter(p => p.id !== product.id);
            saveProducts(newProducts);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("✅ تم الحذف", "تم حذف المنتج بنجاح");
          },
        },
      ]
    );
  };

  const handleToggleActive = (product: Product) => {
    const newProducts = products.map(p =>
      p.id === product.id ? { ...p, isActive: !p.isActive } : p
    );
    saveProducts(newProducts);
    Haptics.selectionAsync();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("تنبيه", "نحتاج إلى إذن الوصول إلى المعرض لاختيار الصورة");
      return;
    }

    setPickingImage(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    setPickingImage(false);

    if (!result.canceled && result.assets[0].uri) {
      setProductImage(result.assets[0].uri);
    }
  };

  const handleSaveProduct = async () => {
    if (!productName.trim()) {
      Alert.alert("تنبيه", "الرجاء إدخال اسم المنتج");
      return;
    }
    if (!productPrice || isNaN(parseFloat(productPrice))) {
      Alert.alert("تنبيه", "الرجاء إدخال سعر صحيح");
      return;
    }
    if (!productDescription.trim()) {
      Alert.alert("تنبيه", "الرجاء إدخال وصف المنتج");
      return;
    }

    setSaving(true);

    const newProduct: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: productName.trim(),
      price: parseFloat(productPrice),
      description: productDescription.trim(),
      image: productImage || `https://picsum.photos/200/150?random=${Date.now()}`,
      isActive: true,
      createdAt: editingProduct?.createdAt || Date.now(),
      category: productCategory || "عام",
      stock: productStock ? parseInt(productStock) : undefined,
      soldCount: editingProduct?.soldCount || 0,
    };

    let newProducts: Product[];
    if (editingProduct) {
      newProducts = products.map(p => p.id === editingProduct.id ? newProduct : p);
    } else {
      newProducts = [newProduct, ...products];
    }

    await saveProducts(newProducts);
    setModalVisible(false);
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(editingProduct ? "✅ تم التحديث" : "✅ تم الإضافة", 
      editingProduct ? "تم تحديث المنتج بنجاح" : "تم إضافة المنتج بنجاح");
  };

  // فلترة المنتجات
  const filteredProducts = products.filter(product => {
    // فلتر الحالة
    if (filterType === "active" && !product.isActive) return false;
    if (filterType === "inactive" && product.isActive) return false;
    // فلتر البحث
    if (searchQuery) {
      return product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return true;
  });

  // ترتيب المنتجات
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortType) {
      case "latest":
        return b.createdAt - a.createdAt;
      case "price_asc":
        return a.price - b.price;
      case "price_desc":
        return b.price - a.price;
      case "name_asc":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // إحصائيات
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.isActive).length;
  const inactiveProducts = products.filter(p => !p.isActive).length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalSold = products.reduce((sum, p) => sum + (p.soldCount || 0), 0);
  const totalValue = products.reduce((sum, p) => sum + p.price, 0);

  const filters = [
    { key: "all", label: "الكل", count: totalProducts, icon: "grid" },
    { key: "active", label: "نشط", count: activeProducts, icon: "eye", color: "#28A745" },
    { key: "inactive", label: "غير نشط", count: inactiveProducts, icon: "eye-off", color: "#DC3545" },
  ];

  const sortOptions = [
    { key: "latest", label: "الأحدث", icon: "clock" },
    { key: "price_asc", label: "السعر: من الأقل للأعلى", icon: "trending-up" },
    { key: "price_desc", label: "السعر: من الأعلى للأقل", icon: "trending-down" },
    { key: "name_asc", label: "الاسم: أ-ي", icon: "sort-alphabetical" },
  ];

  const renderProductCard = ({ item }: { item: Product }) => (
    <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Product Image */}
      <TouchableOpacity onPress={() => handleEditProduct(item)} style={styles.productImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImagePlaceholder, { backgroundColor: colors.muted }]}>
            <Feather name="image" size={28} color={colors.textLight} />
          </View>
        )}
        <TouchableOpacity
          style={[styles.activeToggle, { backgroundColor: item.isActive ? "#28A745" : "#DC3545" }]}
          onPress={() => handleToggleActive(item)}
        >
          <Feather name={item.isActive ? "eye" : "eye-off"} size={12} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Product Info */}
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
        
        <View style={styles.productMeta}>
          {item.category && (
            <View style={[styles.categoryTag, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="tag" size={10} color={colors.primary} />
              <Text style={[styles.categoryText, { color: colors.primary }]}>{item.category}</Text>
            </View>
          )}
          {item.stock !== undefined && (
            <View style={[styles.stockTag, { backgroundColor: (item.stock > 0 ? "#28A745" : "#DC3545") + "15" }]}>
              <Feather name="package" size={10} color={item.stock > 0 ? "#28A745" : "#DC3545"} />
              <Text style={[styles.stockText, { color: item.stock > 0 ? "#28A745" : "#DC3545" }]}>
                {item.stock > 0 ? `${item.stock} متبقي` : "نفذ"}
              </Text>
            </View>
          )}
          {item.soldCount && item.soldCount > 0 && (
            <View style={[styles.soldTag, { backgroundColor: "#FF980015" }]}>
              <Feather name="trending-up" size={10} color="#FF9800" />
              <Text style={[styles.soldText, { color: "#FF9800" }]}>تم بيع {item.soldCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.muted }]}
          onPress={() => handleEditProduct(item)}
        >
          <Feather name="edit-2" size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#DC354515" }]}
          onPress={() => handleDeleteProduct(item)}
        >
          <Feather name="trash-2" size={16} color="#DC3545" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#FF6584", paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-right" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>منتجاتي</Text>
          <TouchableOpacity onPress={handleAddProduct} style={styles.addBtn}>
            <Feather name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Summary */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="package" size={18} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{totalProducts}</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>منتجات</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="box" size={18} color="#28A745" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{totalStock}</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>قطع بالمخزون</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="shopping-bag" size={18} color="#FF9800" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{totalSold}</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>تم بيعه</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="credit-card" size={18} color="#6C63FF" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{totalValue} ₪</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>إجمالي القيمة</Text>
          </View>
        </View>
      </ScrollView>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: filterType === filter.key ? "#FF6584" : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setFilterType(filter.key as FilterType)}
          >
            <Feather name={filter.icon as any} size={14} color={filterType === filter.key ? "#fff" : colors.textGray} />
            <Text style={[styles.filterText, { color: filterType === filter.key ? "#fff" : colors.textGray }]}>
              {filter.label} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search & Sort */}
      <View style={styles.searchSortRow}>
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
        
        <TouchableOpacity
          style={[styles.sortBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Feather name="filter" size={18} color={colors.textGray} />
        </TouchableOpacity>
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={[styles.sortMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortOption,
                sortType === option.key && { backgroundColor: colors.primary + "10" },
              ]}
              onPress={() => {
                setSortType(option.key as SortType);
                setShowSortMenu(false);
              }}
            >
              <Feather name={option.icon as any} size={16} color={sortType === option.key ? colors.primary : colors.textGray} />
              <Text style={[styles.sortOptionText, { color: sortType === option.key ? colors.primary : colors.textGray }]}>
                {option.label}
              </Text>
              {sortType === option.key && <Feather name="check" size={14} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Products List */}
      <FlatList
        data={sortedProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="package" size={48} color={colors.textLight} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد منتجات</Text>
            <Text style={[styles.emptySub, { color: colors.textGray }]}>
              {searchQuery ? "لا توجد نتائج مطابقة للبحث" : "اضغط على زر + لإضافة منتج جديد"}
            </Text>
          </View>
        }
        renderItem={renderProductCard}
      />

      {/* Add/Edit Product Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingProduct ? "تعديل منتج" : "إضافة منتج جديد"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={colors.textGray} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Image Picker */}
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {productImage ? (
                  <Image source={{ uri: productImage }} style={styles.imagePreview} />
                ) : (
                  <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
                    {pickingImage ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <>
                        <Feather name="camera" size={24} color={colors.textGray} />
                        <Text style={[styles.imagePickerText, { color: colors.textGray }]}>اختر صورة</Text>
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textGray }]}>اسم المنتج *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={productName}
                  onChangeText={setProductName}
                  placeholder="مثال: قميص قطني"
                  placeholderTextColor={colors.textLight}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textGray }]}>السعر (₪) *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                    value={productPrice}
                    onChangeText={setProductPrice}
                    keyboardType="numeric"
                    placeholder="مثال: 49"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textGray }]}>المخزون</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                    value={productStock}
                    onChangeText={setProductStock}
                    keyboardType="numeric"
                    placeholder="مثال: 50"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textGray }]}>التصنيف</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={productCategory}
                  onChangeText={setProductCategory}
                  placeholder="مثال: ملابس، إلكترونيات..."
                  placeholderTextColor={colors.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textGray }]}>وصف المنتج *</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={productDescription}
                  onChangeText={setProductDescription}
                  placeholder="وصف تفصيلي للمنتج..."
                  placeholderTextColor={colors.textLight}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: colors.muted }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textGray }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: "#FF6584", opacity: saving ? 0.7 : 1 }]}
                onPress={handleSaveProduct}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>{editingProduct ? "تحديث" : "إضافة"}</Text>
                )}
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
  
  // Header
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { padding: 8 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  addBtn: { padding: 8 },
  
  // Stats
  statsScroll: { flexGrow: 0 },
  statsContainer: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  statCard: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, gap: 6 },
  statValue: { fontSize: 14, fontWeight: "700" },
  statLabel: { fontSize: 10 },
  
  // Filters
  filtersContainer: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, gap: 10 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: "600" },
  
  // Search & Sort
  searchSortRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  searchContainer: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  sortBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  
  // Sort Menu
  sortMenu: { position: "absolute", top: 200, right: 16, width: 180, borderRadius: 12, borderWidth: 1, zIndex: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  sortOption: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  sortOptionText: { flex: 1, fontSize: 13 },
  
  // Product Card
  productCard: { flexDirection: "row", borderRadius: 16, borderWidth: 1, padding: 12, gap: 12 },
  productImageContainer: { position: "relative" },
  productImage: { width: 80, height: 80, borderRadius: 12 },
  productImagePlaceholder: { width: 80, height: 80, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  activeToggle: { position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  productInfo: { flex: 1, gap: 6 },
  productHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  productName: { fontSize: 14, fontWeight: "700", flex: 1 },
  productPrice: { fontSize: 14, fontWeight: "800" },
  productDesc: { fontSize: 11 },
  productMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  categoryTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  categoryText: { fontSize: 10, fontWeight: "600" },
  stockTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  stockText: { fontSize: 10, fontWeight: "600" },
  soldTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  soldText: { fontSize: 10, fontWeight: "600" },
  productActions: { justifyContent: "center", gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  
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
  imagePicker: { alignItems: "center", marginBottom: 8 },
  imagePreview: { width: 100, height: 100, borderRadius: 12 },
  imagePlaceholder: { width: 100, height: 100, borderRadius: 12, justifyContent: "center", alignItems: "center", gap: 6 },
  imagePickerText: { fontSize: 11 },
  inputGroup: { gap: 6 },
  inputRow: { flexDirection: "row", gap: 12 },
  inputLabel: { fontSize: 12, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  textArea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, minHeight: 80 },
  modalFooter: { flexDirection: "row", gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: "#E5E5E5" },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  modalCancelText: { fontSize: 14, fontWeight: "600" },
  modalSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  modalSaveText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});