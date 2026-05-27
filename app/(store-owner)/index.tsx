// app/(store-owner)/index.tsx
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Product {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

const STORAGE_KEY = "@store_products";

export default function StoreOwnerDashboard() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { orders } = useOrders();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY}_${user?.id}`);
      if (stored) {
        setProducts(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts().then(() => setRefreshing(false));
  };

  // طلبات المتجر
  const storeOrders = orders.filter(o => o.customerId === user?.id);
  const pendingOrders = storeOrders.filter(o => ["pending", "bidding"].includes(o.status)).length;
  const completedOrders = storeOrders.filter(o => o.status === "completed").length;
  const totalRevenue = storeOrders.reduce((sum, o) => sum + (o.finalPrice || 0), 0);
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.isActive).length;

  // آخر 5 طلبات
  const recentOrders = [...storeOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const stats = [
    { label: "إجمالي المنتجات", value: totalProducts.toString(), icon: "shopping-bag", color: "#6C63FF", bg: "#6C63FF15" },
    { label: "منتجات نشطة", value: activeProducts.toString(), icon: "eye", color: "#28A745", bg: "#28A74515" },
    { label: "الإيرادات", value: `${totalRevenue} ₪`, icon: "credit-card", color: "#FF9800", bg: "#FF980015" },
    { label: "طلبات معلقة", value: pendingOrders.toString(), icon: "clock", color: "#FFA63D", bg: "#FFA63D15" },
    { label: "طلبات مكتملة", value: completedOrders.toString(), icon: "check-circle", color: "#28A745", bg: "#28A74515" },
  ];

  const quickActions = [
    { label: "إضافة منتج", icon: "plus", color: "#FF6584", route: "/products", action: () => router.push("/(store-owner)/products") },
    { label: "منتجاتي", icon: "shopping-bag", color: "#6C63FF", route: "/products", action: () => router.push("/(store-owner)/products") },
    { label: "الطلبات", icon: "list", color: "#17A2B8", route: "/orders", action: () => router.push("/(store-owner)/orders") },
    { label: "حسابي", icon: "user", color: "#28A745", route: "/profile", action: () => router.push("/(store-owner)/profile") },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "#28A745";
      case "delivered": return "#28A745";
      case "cancelled": return "#DC3545";
      default: return "#FFA63D";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return "مكتمل";
      case "delivered": return "تم التوصيل";
      case "cancelled": return "ملغي";
      default: return "قيد التنفيذ";
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: "#FF6584", paddingTop: topPad + 16 }]}>
          <Text style={styles.headerGreeting}>مرحباً 👋</Text>
          <Text style={styles.headerName}>{user?.fullName || "صاحب المتجر"}</Text>
          <Text style={styles.headerSub}>لوحة تحكم المتجر</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <Feather name={stat.icon as any} size={18} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textGray }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>إجراءات سريعة</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={action.action}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + "15" }]}>
                  <Feather name={action.icon as any} size={20} color={action.color} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📋 آخر الطلبات</Text>
            <TouchableOpacity onPress={() => router.push("/(store-owner)/orders")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text>
            </TouchableOpacity>
          </View>
          
          {recentOrders.length === 0 ? (
            <View style={[styles.emptyOrders, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="inbox" size={40} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textGray }]}>لا توجد طلبات بعد</Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: "/track-order", params: { orderId: order.id } })}
              >
                <View style={styles.orderHeader}>
                  <Text style={[styles.orderId, { color: colors.primary }]}>#{order.id.slice(-6)}</Text>
                  <View style={[styles.orderStatus, { backgroundColor: getStatusColor(order.status) + "15" }]}>
                    <Text style={[styles.orderStatusText, { color: getStatusColor(order.status) }]}>
                      {getStatusLabel(order.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderDetails}>
                  <Feather name="map-pin" size={12} color={colors.textGray} />
                  <Text style={[styles.orderAddress, { color: colors.textGray }]} numberOfLines={1}>
                    {order.deliveryAddress}
                  </Text>
                </View>
                <View style={styles.orderFooter}>
                  <Text style={[styles.orderPrice, { color: colors.primary }]}>{order.finalPrice} ₪</Text>
                  <Text style={[styles.orderDate, { color: colors.textLight }]}>
                    {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  
  // Header
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerGreeting: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  headerName: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 4 },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 },
  
  // Stats Grid
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, padding: 16 },
  statCard: { width: "31%", alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1, gap: 6 },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "800" },
  statLabel: { fontSize: 10, textAlign: "center" },
  
  // Section
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  seeAll: { fontSize: 13, fontWeight: "600" },
  
  // Quick Actions
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: { width: "48%", flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  actionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  actionLabel: { fontSize: 14, fontWeight: "600" },
  
  // Orders
  emptyOrders: { alignItems: "center", paddingVertical: 30, borderRadius: 14, borderWidth: 1, gap: 8 },
  emptyText: { fontSize: 13 },
  orderCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginBottom: 8 },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 13, fontWeight: "700" },
  orderStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  orderStatusText: { fontSize: 10, fontWeight: "600" },
  orderDetails: { flexDirection: "row", alignItems: "center", gap: 6 },
  orderAddress: { fontSize: 12, flex: 1 },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  orderPrice: { fontSize: 14, fontWeight: "800" },
  orderDate: { fontSize: 11 },
});