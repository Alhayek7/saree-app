// app/(admin)/users.tsx
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

const MOCK_USERS = [
  { id: "1", name: "أحمد محمد", phone: "0591234567", role: "عميل", status: "نشط", date: "2026-01-15", orders: 23 },
  { id: "2", name: "محمد سعيد", phone: "0597654321", role: "سائق", status: "نشط", date: "2026-01-20", orders: 156 },
  { id: "3", name: "متجر الأمل", phone: "0598887777", role: "صاحب متجر", status: "نشط", date: "2026-02-01", orders: 45 },
  { id: "4", name: "بقالة السلام", phone: "0591112222", role: "وكيل", status: "موقوف", date: "2026-02-10", orders: 12 },
  { id: "5", name: "نور إبراهيم", phone: "0595556666", role: "عميل", status: "نشط", date: "2026-03-01", orders: 8 },
  { id: "6", name: "سامي نصر", phone: "0592233445", role: "سائق", status: "موقوف", date: "2026-03-05", orders: 89 },
];

// ==================== المكون الرئيسي ====================

export default function AdminUsersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // إحصائيات المستخدمين
  const stats = useMemo(() => {
    const total = MOCK_USERS.length;
    const active = MOCK_USERS.filter(u => u.status === "نشط").length;
    const inactive = MOCK_USERS.filter(u => u.status === "موقوف").length;
    return { total, active, inactive };
  }, []);

  // قائمة الفلاتر مع الإحصائيات
const filters = useMemo(() => [
  { key: "all", label: "الكل", count: stats.total, icon: "users" },
  { key: "عميل", label: "عملاء", count: MOCK_USERS.filter(u => u.role === "عميل").length, icon: "user" },
  { key: "سائق", label: "سائقين", count: MOCK_USERS.filter(u => u.role === "سائق").length, icon: "truck" },
  { key: "صاحب متجر", label: "متاجر", count: MOCK_USERS.filter(u => u.role === "صاحب متجر").length, icon: "shopping-bag" },
  { key: "وكيل", label: "وكلاء", count: MOCK_USERS.filter(u => u.role === "وكيل").length, icon: "briefcase" },
], [stats]);

  // تصفية المستخدمين
  const filteredUsers = useMemo(() => {
    let filtered = MOCK_USERS;
    if (filter !== "all") {
      filtered = filtered.filter(u => u.role === filter);
    }
    if (search.trim()) {
      filtered = filtered.filter(u => 
        u.name.includes(search) || u.phone.includes(search)
      );
    }
    return filtered;
  }, [search, filter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleToggleStatus = (user: typeof MOCK_USERS[0]) => {
    Alert.alert(
      user.status === "نشط" ? "🔴 تعليق المستخدم" : "🟢 تفعيل المستخدم",
      `هل أنت متأكد من ${user.status === "نشط" ? "تعليق" : "تفعيل"} حساب ${user.name}؟`,
      [
        { text: "إلغاء", style: "cancel" },
        { text: "تأكيد", onPress: () => console.log("Toggle status for", user.id) }
      ]
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "عميل": return "user";
      case "سائق": return "truck";
      case "صاحب متجر": return "shopping-bag";
      case "وكيل": return "briefcase";
      default: return "user";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "عميل": return "#4CAF50";
      case "سائق": return "#FF9800";
      case "صاحب متجر": return "#9C27B0";
      case "وكيل": return "#00BCD4";
      default: return ADMIN_COLOR;
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* ==================== Header ==================== */}
      <View style={[styles.header, { backgroundColor: ADMIN_COLOR, paddingTop: topPad + 14 }]}>
        <Text style={styles.headerTitle}>إدارة المستخدمين</Text>
        <Text style={styles.headerSub}>إدارة وعرض جميع المستخدمين</Text>
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

{/* ==================== فلاتر - تمرير أفقي ==================== */}
<ScrollView 
  horizontal 
  showsHorizontalScrollIndicator={true}
  style={{ flexGrow: 0 }}
  contentContainerStyle={{ 
    flexDirection: "row", 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    gap: 10 
  }}
>
  {filters.map((f) => (
    <TouchableOpacity
      key={f.key}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 24,
          borderWidth: 1.5,
          backgroundColor: filter === f.key ? ADMIN_COLOR : "#fff",
          borderColor: filter === f.key ? ADMIN_COLOR : "#E5E5E5",
        },
      ]}
      onPress={() => setFilter(f.key)}
    >
      <Feather 
        name={f.icon as any} 
        size={12} 
        color={filter === f.key ? "#fff" : "#666"} 
      />
      <Text style={{
        fontSize: 12,
        fontWeight: "600",
        color: filter === f.key ? "#fff" : "#666",
      }}>
        {f.label} ({f.count})
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>
      {/* ==================== قائمة المستخدمين ==================== */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ADMIN_COLOR]} />}
      >
        {filteredUsers.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: ADMIN_COLOR + "15" }]}>
              <Feather name="users" size={32} color={ADMIN_COLOR} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد نتائج</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textGray }]}>
              {search ? "لم يتم العثور على مستخدمين مطابقين للبحث" : "لا يوجد مستخدمين في هذه الفئة"}
            </Text>
          </View>
        ) : (
          filteredUsers.map((user) => {
            const roleColor = getRoleColor(user.role);
            const roleIcon = getRoleIcon(user.role);
            const isActive = user.status === "نشط";
            
            return (
              <View key={user.id} style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* صورة المستخدم */}
                <View style={[styles.userAvatar, { backgroundColor: roleColor + "15" }]}>
                  <Text style={[styles.userInitial, { color: roleColor }]}>{user.name.charAt(0)}</Text>
                </View>

                {/* معلومات المستخدم */}
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.foreground }]}>{user.name}</Text>
                  <Text style={[styles.userPhone, { color: colors.textGray }]}>{user.phone}</Text>
                  <View style={styles.userDetails}>
                    <View style={[styles.roleBadge, { backgroundColor: roleColor + "10" }]}>
                      <Feather name={roleIcon as any} size={10} color={roleColor} />
                      <Text style={[styles.roleText, { color: roleColor }]}>{user.role}</Text>
                    </View>
                    <Text style={[styles.userOrders, { color: colors.textLight }]}>{user.orders} طلب</Text>
                  </View>
                </View>

                {/* الحالة والأزرار */}
                <View style={styles.userActions}>
                  <View style={[styles.statusBadge, { backgroundColor: isActive ? "#4CAF5015" : "#DC354515" }]}>
                    <View style={[styles.statusDot, { backgroundColor: isActive ? "#4CAF50" : "#DC3545" }]} />
                    <Text style={[styles.statusText, { color: isActive ? "#4CAF50" : "#DC3545" }]}>{user.status}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: ADMIN_COLOR + "10" }]}
                    onPress={() => handleToggleStatus(user)}
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
  
  // Stats Row - 3 بطاقات إحصائيات متساوية
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
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 4 },
  
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
  
  // Filters - أزرار التصفية
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
  filterText: { 
    fontSize: 13, 
    fontWeight: "600",
  },
  
  // List - قائمة المستخدمين
  listContainer: { padding: 16, gap: 12, paddingBottom: 40 },
  
  // User Card - بطاقة المستخدم
  userCard: { 
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
  userAvatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    justifyContent: "center", 
    alignItems: "center",
  },
  userInitial: { fontSize: 22, fontWeight: "700" },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "700" },
  userPhone: { fontSize: 12, marginTop: 2, color: "#666" },
  userDetails: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 14 },
  roleText: { fontSize: 10, fontWeight: "600" },
  userOrders: { fontSize: 11, fontWeight: "500", color: "#999" },
  
  // Actions - أزرار الإجراءات
  userActions: { alignItems: "flex-end", gap: 8 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 10, fontWeight: "600" },
  actionBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  
  // Empty State - حالة عدم وجود بيانات
  emptyCard: { alignItems: "center", padding: 40, borderRadius: 16, borderWidth: 1, gap: 12, backgroundColor: "#fff" },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySubtitle: { fontSize: 12, textAlign: "center", color: "#999" },
});