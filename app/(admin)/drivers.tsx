// app/(admin)/drivers.tsx
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import React, { useState, useMemo, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ADMIN_COLOR = "#1E88E5";
const ADMIN_DARK = "#0D47A1";

// ==================== البيانات التجريبية ====================

const MOCK_DRIVERS = [
  { id: "1", name: "أحمد محمد", phone: "0591234567", vehicle: "سيارة", status: "نشط", rating: 4.8, deliveries: 156, balance: 120 },
  { id: "2", name: "محمد سعيد", phone: "0597654321", vehicle: "بسكليت", status: "نشط", rating: 4.9, deliveries: 234, balance: 85 },
  { id: "3", name: "خالد أحمد", phone: "0591122334", vehicle: "سيارة", status: "موقوف", rating: 4.6, deliveries: 89, balance: 0 },
  { id: "4", name: "سامي نصر", phone: "0592233445", vehicle: "بسكليت", status: "نشط", rating: 4.7, deliveries: 145, balance: 45 },
  { id: "5", name: "عمر رشيد", phone: "0593344556", vehicle: "نقل", status: "قيد المراجعة", rating: 0, deliveries: 0, balance: 0 },
  { id: "6", name: "يوسف إبراهيم", phone: "0594455667", vehicle: "سيارة", status: "نشط", rating: 4.9, deliveries: 312, balance: 200 },
];

// ==================== المكون الرئيسي ====================

export default function AdminDriversScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // إحصائيات السائقين
  const stats = useMemo(() => {
    const total = MOCK_DRIVERS.length;
    const active = MOCK_DRIVERS.filter(d => d.status === "نشط").length;
    const inactive = MOCK_DRIVERS.filter(d => d.status === "موقوف").length;
    const pending = MOCK_DRIVERS.filter(d => d.status === "قيد المراجعة").length;
    return { total, active, inactive, pending };
  }, []);

  // قائمة الفلاتر
  const filters = useMemo(() => [
    { key: "all", label: "الكل", count: stats.total, icon: "users" },
    { key: "نشط", label: "نشط", count: stats.active, icon: "check-circle", color: "#4CAF50" },
    { key: "موقوف", label: "موقوف", count: stats.inactive, icon: "x-circle", color: "#DC3545" },
    { key: "قيد المراجعة", label: "قيد المراجعة", count: stats.pending, icon: "clock", color: "#FFA63D" },
  ], [stats]);

  // تصفية السائقين
  const filteredDrivers = useMemo(() => {
    let filtered = MOCK_DRIVERS;
    if (filter !== "all") {
      filtered = filtered.filter(d => d.status === filter);
    }
    if (search.trim()) {
      filtered = filtered.filter(d => 
        d.name.includes(search) || d.phone.includes(search)
      );
    }
    return filtered;
  }, [search, filter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleToggleStatus = (driver: typeof MOCK_DRIVERS[0]) => {
    Alert.alert(
      driver.status === "نشط" ? "🔴 تعليق السائق" : "🟢 تفعيل السائق",
      `هل أنت متأكد من ${driver.status === "نشط" ? "تعليق" : "تفعيل"} حساب السائق ${driver.name}؟`,
      [
        { text: "إلغاء", style: "cancel" },
        { text: "تأكيد", onPress: () => console.log("Toggle status for", driver.id) }
      ]
    );
  };

  const getVehicleIcon = (vehicle: string) => {
    switch (vehicle) {
      case "سيارة": return "car";
      case "بسكليت": return "bike";
      case "نقل": return "truck";
      default: return "car";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "نشط": return "#4CAF50";
      case "موقوف": return "#DC3545";
      case "قيد المراجعة": return "#FFA63D";
      default: return ADMIN_COLOR;
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* ==================== Header ==================== */}
      <View style={[styles.header, { backgroundColor: ADMIN_COLOR, paddingTop: topPad + 14 }]}>
        <Text style={styles.headerTitle}>إدارة السائقين</Text>
        <Text style={styles.headerSub}>إدارة وعرض جميع السائقين</Text>
      </View>

      {/* ==================== إحصائيات سريعة ==================== */}
      <View style={styles.statsRow}>
        <View style={[styles.statItem, { backgroundColor: colors.card }]}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.textGray }]}>إجمالي</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.card }]}>
          <Text style={[styles.statValue, { color: "#4CAF50" }]}>{stats.active}</Text>
          <Text style={[styles.statLabel, { color: colors.textGray }]}>نشط</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.card }]}>
          <Text style={[styles.statValue, { color: "#DC3545" }]}>{stats.inactive}</Text>
          <Text style={[styles.statLabel, { color: colors.textGray }]}>موقوف</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.card }]}>
          <Text style={[styles.statValue, { color: "#FFA63D" }]}>{stats.pending}</Text>
          <Text style={[styles.statLabel, { color: colors.textGray }]}>مراجعة</Text>
        </View>
      </View>

      {/* ==================== بحث ==================== */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={18} color={colors.textGray} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="بحث باسم أو رقم الجوال..."
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
        {search !== "" && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={18} color={colors.textGray} />
          </TouchableOpacity>
        )}
      </View>

      {/* ==================== فلاتر ==================== */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterContainer}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                filter === f.key && styles.filterChipActive,
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Feather 
                name={f.icon as any} 
                size={12} 
                color={filter === f.key ? "#fff" : colors.textGray} 
              />
              <Text style={[
                styles.filterText, 
                { color: filter === f.key ? "#fff" : colors.textGray }
              ]}>
                {f.label} ({f.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ==================== قائمة السائقين ==================== */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ADMIN_COLOR]} />}
      >
        {filteredDrivers.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: ADMIN_COLOR + "15" }]}>
              <Feather name="truck" size={32} color={ADMIN_COLOR} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد نتائج</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textGray }]}>
              {search ? "لم يتم العثور على سائقين مطابقين للبحث" : "لا يوجد سائقين في هذه الفئة"}
            </Text>
          </View>
        ) : (
          filteredDrivers.map((driver) => {
            const statusColor = getStatusColor(driver.status);
            const vehicleIcon = getVehicleIcon(driver.vehicle);
            const isActive = driver.status === "نشط";
            
            return (
              <View key={driver.id} style={[styles.driverCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* صورة السائق */}
                <View style={[styles.driverAvatar, { backgroundColor: statusColor + "15" }]}>
                  <Text style={[styles.driverInitial, { color: statusColor }]}>{driver.name.charAt(0)}</Text>
                </View>

                {/* معلومات السائق */}
                <View style={styles.driverInfo}>
                  <Text style={[styles.driverName, { color: colors.foreground }]}>{driver.name}</Text>
                  <Text style={[styles.driverPhone, { color: colors.textGray }]}>{driver.phone}</Text>
                  <View style={styles.driverDetails}>
                    <View style={styles.vehicleBadge}>
                      <Feather name={vehicleIcon as any} size={10} color={colors.textGray} />
                      <Text style={[styles.vehicleText, { color: colors.textGray }]}>{driver.vehicle}</Text>
                    </View>
                    <Text style={[styles.ratingText, { color: colors.textGray }]}>⭐ {driver.rating}</Text>
                    <Text style={[styles.deliveriesText, { color: colors.textGray }]}>{driver.deliveries} توصيلة</Text>
                  </View>
                  <Text style={[styles.balanceText, { color: "#28A745", fontWeight: "600" }]}>رصيد: {driver.balance} ₪</Text>
                </View>

                {/* الحالة والأزرار */}
                <View style={styles.driverActions}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + "15" }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{driver.status}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: ADMIN_COLOR + "10" }]}
                    onPress={() => handleToggleStatus(driver)}
                  >
                    <Feather name={isActive ? "pause-circle" : "play-circle"} size={16} color={ADMIN_COLOR} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: ADMIN_COLOR + "10" }]}>
                    <Feather name="more-horizontal" size={16} color={ADMIN_COLOR} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== الأنماط ====================

const styles = StyleSheet.create({
  safe: { flex: 1 },
  
  // Header
  header: { 
    paddingHorizontal: 20, 
    paddingBottom: 20, 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24,
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 4 },
  
  // Stats Row
  statsRow: { 
    flexDirection: "row", 
    gap: 12, 
    marginHorizontal: 16, 
    marginTop: -20, 
    marginBottom: 16,
  },
  statItem: { 
    flex: 1, 
    alignItems: "center", 
    paddingVertical: 12, 
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, marginTop: 4 },
  
  // Search
  searchContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginHorizontal: 16, 
    paddingHorizontal: 14, 
    borderRadius: 14, 
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, marginLeft: 8 },
  
  // Filters
  filterScroll: { flexGrow: 0 },
  filterContainer: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  filterChip: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 24, 
    borderWidth: 1.5,
    backgroundColor: "#fff",
    borderColor: "#E5E5E5",
  },
  filterChipActive: {
    backgroundColor: ADMIN_COLOR,
    borderColor: ADMIN_COLOR,
  },
  filterText: { fontSize: 13, fontWeight: "600" },
  
  // List
  listContainer: { padding: 16, gap: 12, paddingBottom: 40 },
  
  // Driver Card
  driverCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 14, 
    padding: 14, 
    borderRadius: 18, 
    borderWidth: 1,
    backgroundColor: "#fff",
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  driverAvatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    justifyContent: "center", 
    alignItems: "center",
  },
  driverInitial: { fontSize: 22, fontWeight: "700" },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: "700" },
  driverPhone: { fontSize: 12, marginTop: 2, color: "#666" },
  driverDetails: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" },
  vehicleBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F5F5F5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  vehicleText: { fontSize: 10 },
  ratingText: { fontSize: 10, color: "#FF9800" },
  deliveriesText: { fontSize: 10, color: "#666" },
  balanceText: { fontSize: 11, marginTop: 4 },
  
  // Actions
  driverActions: { alignItems: "flex-end", gap: 8 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 10, fontWeight: "600" },
  actionBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  
  // Empty State
  emptyCard: { alignItems: "center", padding: 40, borderRadius: 16, borderWidth: 1, gap: 12, backgroundColor: "#fff" },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySubtitle: { fontSize: 12, textAlign: "center", color: "#999" },
});