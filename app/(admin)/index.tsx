// app/(admin)/index.tsx
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const ADMIN_COLOR = "#1E88E5";
const ADMIN_DARK = "#0D47A1";

// ==================== البيانات ====================


// ==================== الإحصائيات الرئيسية (شكل عمودي) ====================
const STATS = [
  { id: "users", label: "المستخدمين", value: 156, icon: "users", color: "#4CAF50", change: "+12%", changeType: "up" },
  { id: "drivers", label: "السائقين", value: 45, icon: "truck", color: "#FF9800", change: "+5%", changeType: "up" },
  { id: "stores", label: "المتاجر", value: 23, icon: "shopping-bag", color: "#9C27B0", change: "+3%", changeType: "up" },
  { id: "recharge", label: "طلبات الشحن", value: 12, icon: "refresh-cw", color: "#FFA63D", change: "-2%", changeType: "down" },
];
// الإجراءات السريعة
const QUICK_ACTIONS = [
  { title: "طلبات الشحن", icon: "refresh-cw", route: "/recharge", color: ADMIN_COLOR, badge: 12 },
  { title: "المستخدمين", icon: "users", route: "/users", color: ADMIN_COLOR, badge: 156 },
  { title: "السائقين", icon: "truck", route: "/drivers", color: ADMIN_COLOR, badge: 45 },
  { title: "المتاجر", icon: "shopping-bag", route: "/stores", color: ADMIN_COLOR, badge: 23 },
  { title: "الإعدادات", icon: "settings", route: "/settings", color: ADMIN_COLOR, badge: null },
];

// النشاطات الأخيرة
const RECENT_ACTIVITIES = [
  { id: 1, type: "user", title: "مستخدم جديد", subtitle: "أحمد محمد", time: "منذ 5 دقائق", icon: "user-plus", color: "#4CAF50" },
  { id: 2, type: "driver", title: "سائق جديد", subtitle: "محمد سعيد", time: "منذ 15 دقيقة", icon: "truck", color: "#FF9800" },
  { id: 3, type: "store", title: "متجر جديد", subtitle: "متجر الأمل", time: "منذ ساعة", icon: "shopping-bag", color: "#9C27B0" },
  { id: 4, type: "recharge", title: "طلب شحن جديد", subtitle: "وكيل: بقالة السلام", time: "منذ ساعتين", icon: "refresh-cw", color: "#FFA63D" },
];

// ==================== المكون الرئيسي ====================

export default function AdminDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("صباح الخير");
    else if (hour < 18) setGreeting("مساء الخير");
    else setGreeting("مساء الخير");
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* ==================== Header ==================== */}
      <View style={[styles.header, { backgroundColor: ADMIN_COLOR, paddingTop: topPad + 16 }]}>
        <View>
          <Text style={styles.headerGreeting}>{greeting} 👋</Text>
          <Text style={styles.headerTitle}>{user?.fullName || "مدير النظام"}</Text>
          <Text style={styles.headerSub}>مرحباً بك في لوحة التحكم</Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: ADMIN_DARK }]}>
          <Text style={styles.headerBadgeText}>أدمن</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ADMIN_COLOR]} />}
      >
        {/* ==================== قسم الإحصائيات ==================== */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📊 الإحصائيات</Text>
{/* الإحصائيات - تصميم عمودي */}
<View style={styles.statsGrid}>
  {STATS.map((stat) => (
    <View key={stat.id} style={[styles.statCard, { backgroundColor: colors.card }]}>
      {/* الأيقونة في الأعلى */}
      <View style={[styles.statIcon, { backgroundColor: stat.color + "15" }]}>
        <Feather name={stat.icon as any} size={24} color={stat.color} />
      </View>
      
      {/* الرقم كبير في المنتصف */}
      <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
      
      {/* النص أسفل الرقم */}
      <Text style={[styles.statLabel, { color: colors.textGray }]}>{stat.label}</Text>
      
      {/* نسبة التغير */}
      <View style={[styles.statChange, { backgroundColor: stat.changeType === "up" ? "#4CAF5015" : "#DC354515" }]}>
        <Feather name={stat.changeType === "up" ? "arrow-up" : "arrow-down"} size={10} color={stat.changeType === "up" ? "#4CAF50" : "#DC3545"} />
        <Text style={[styles.statChangeText, { color: stat.changeType === "up" ? "#4CAF50" : "#DC3545" }]}>{stat.change}</Text>
      </View>
    </View>
  ))}
</View>
        </View>

        {/* ==================== قسم الإجراءات السريعة ==================== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>⚡ الإجراءات السريعة</Text>
            <TouchableOpacity onPress={() => router.push("/settings" as any)}>
              <Text style={[styles.seeAll, { color: ADMIN_COLOR }]}>عرض الكل</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll}>
            <View style={styles.actionsGrid}>
              {QUICK_ACTIONS.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push(action.route as any)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.color + "15" }]}>
                    <Feather name={action.icon as any} size={22} color={action.color} />
                    {action.badge !== null && (
                      <View style={[styles.actionBadge, { backgroundColor: action.color }]}>
                        <Text style={styles.actionBadgeText}>{action.badge > 99 ? "99+" : action.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.actionTitle, { color: colors.foreground }]}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

{/* ==================== روابط سريعة للصفحات المخفية ==================== */}
<View style={styles.section}>
  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🔗 روابط سريعة</Text>
  <View style={styles.hiddenLinksRow}>
    <TouchableOpacity 
      style={[styles.hiddenLink, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push("/(admin)/orders")}
    >
      <Feather name="package" size={20} color={ADMIN_COLOR} />
      <Text style={[styles.hiddenLinkText, { color: colors.foreground }]}>الطلبات</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[styles.hiddenLink, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push("/(admin)/finance")}
    >
      <Feather name="dollar-sign" size={20} color={ADMIN_COLOR} />
      <Text style={[styles.hiddenLinkText, { color: colors.foreground }]}>المالية</Text>
    </TouchableOpacity>
  </View>
</View>

        {/* ==================== قسم آخر النشاطات ==================== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📋 آخر النشاطات</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: ADMIN_COLOR }]}>عرض الكل</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {RECENT_ACTIVITIES.map((activity, index) => (
              <TouchableOpacity 
                key={activity.id} 
                style={[
                  styles.activityRow, 
                  index < RECENT_ACTIVITIES.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }
                ]}
                activeOpacity={0.7}
              >
                <View style={[styles.activityIcon, { backgroundColor: activity.color + "15" }]}>
                  <Feather name={activity.icon as any} size={16} color={activity.color} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: colors.foreground }]}>{activity.title}</Text>
                  <Text style={[styles.activitySubtitle, { color: colors.textGray }]}>{activity.subtitle}</Text>
                  <Text style={[styles.activityTime, { color: colors.textLight }]}>{activity.time}</Text>
                </View>
                <Feather name="chevron-left" size={18} color={colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ==================== قسم إحصائيات النظام ==================== */}
        <View style={[styles.systemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.systemTitle, { color: colors.foreground }]}>📊 إحصائيات النظام</Text>
          <View style={styles.systemStats}>
            <View style={styles.systemStat}>
              <Text style={[styles.systemStatValue, { color: ADMIN_COLOR }]}>99.8%</Text>
              <Text style={[styles.systemStatLabel, { color: colors.textGray }]}>وقت تشغيل</Text>
            </View>
            <View style={styles.systemDivider} />
            <View style={styles.systemStat}>
              <Text style={[styles.systemStatValue, { color: ADMIN_COLOR }]}>1,234</Text>
              <Text style={[styles.systemStatLabel, { color: colors.textGray }]}>طلب اليوم</Text>
            </View>
            <View style={styles.systemDivider} />
            <View style={styles.systemStat}>
              <Text style={[styles.systemStatValue, { color: ADMIN_COLOR }]}>98%</Text>
              <Text style={[styles.systemStatLabel, { color: colors.textGray }]}>رضا العملاء</Text>
            </View>
          </View>
        </View>
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
    paddingBottom: 24, 
    borderBottomLeftRadius: 28, 
    borderBottomRightRadius: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerGreeting: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginTop: 4 },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  headerBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  headerBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  
  // Container
  container: { padding: 16, gap: 24, paddingBottom: 40 },
  
  // Section
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  seeAll: { fontSize: 12, fontWeight: "600" },
  statsGrid: { 
  flexDirection: "row", 
  flexWrap: "wrap", 
  gap: 12,
  justifyContent: "space-between",
},
statCard: { 
  width: "48%", 
  alignItems: "center", 
  padding: 16, 
  borderRadius: 16, 
  gap: 8,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
},
statIcon: { 
  width: 48, 
  height: 48, 
  borderRadius: 24, 
  justifyContent: "center", 
  alignItems: "center",
  marginBottom: 4,
},
statValue: { 
  fontSize: 28, 
  fontWeight: "800",
  textAlign: "center",
},
statLabel: { 
  fontSize: 12, 
  textAlign: "center",
},
statChange: { 
  flexDirection: "row", 
  alignItems: "center", 
  gap: 2, 
  paddingHorizontal: 8, 
  paddingVertical: 3, 
  borderRadius: 12,
  marginTop: 4,
},
statChangeText: { 
  fontSize: 10, 
  fontWeight: "600" 
},
  
  // Quick Actions
  actionsScroll: { flexGrow: 0 },
  actionsGrid: { flexDirection: "row", gap: 12 },
  actionCard: { width: 100, alignItems: "center", padding: 12, borderRadius: 16, borderWidth: 1, gap: 8 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", position: "relative" },
  actionBadge: { position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  actionBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  actionTitle: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  
  // Recent Activities
  activityCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  activityIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 13, fontWeight: "600" },
  activitySubtitle: { fontSize: 11, marginTop: 2 },
  activityTime: { fontSize: 10, marginTop: 2 },
  
  // System Stats
  systemCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  systemTitle: { fontSize: 14, fontWeight: "700" },
  systemStats: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  systemStat: { alignItems: "center" },
  systemStatValue: { fontSize: 20, fontWeight: "800" },
  systemStatLabel: { fontSize: 10, marginTop: 4 },
  systemDivider: { width: 1, height: 30, backgroundColor: "#E5E5E5" },

hiddenLinksRow: {
  flexDirection: "row",
  gap: 12,
},
hiddenLink: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  paddingVertical: 14,
  borderRadius: 14,
  borderWidth: 1,
},
hiddenLinkText: {
  fontSize: 14,
  fontWeight: "600",
},
  
});