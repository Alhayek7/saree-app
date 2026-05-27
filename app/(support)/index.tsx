// app/(support)/index.tsx
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState, useCallback } from "react";
import {
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

// واجهة التذكرة
interface Ticket {
  id: string;
  user: string;
  title: string;
  status: "open" | "in_progress" | "closed";
  date: string;
  priority: "high" | "medium" | "low";
}

// بيانات تجريبية للتذاكر
const MOCK_TICKETS: Ticket[] = [
  { id: "1", user: "أحمد محمد", title: "مشكلة في تسجيل الدخول", status: "open", date: "2024-05-24", priority: "high" },
  { id: "2", user: "محمد سعيد", title: "تأخر في التوصيل", status: "in_progress", date: "2024-05-23", priority: "medium" },
  { id: "3", user: "متجر الأمل", title: "مشكلة في إضافة منتج", status: "open", date: "2024-05-22", priority: "low" },
  { id: "4", user: "سامي نصر", title: "استفسار عن العمولة", status: "closed", date: "2024-05-21", priority: "low" },
  { id: "5", user: "خالد أحمد", title: "طلب تعديل بيانات", status: "open", date: "2024-05-20", priority: "medium" },
];

export default function SupportDashboard() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [refreshing, setRefreshing] = useState(false);

  // حساب الإحصائيات
  const openTickets = MOCK_TICKETS.filter(t => t.status === "open").length;
  const inProgressTickets = MOCK_TICKETS.filter(t => t.status === "in_progress").length;
  const closedTickets = MOCK_TICKETS.filter(t => t.status === "closed").length;
  const totalTickets = MOCK_TICKETS.length;

  // آخر 3 تذاكر
  const recentTickets = [...MOCK_TICKETS].slice(0, 3);

  const stats = [
    { label: "تذاكر مفتوحة", value: openTickets, icon: "alert-circle", color: "#DC3545", bg: "#DC354515" },
    { label: "قيد المعالجة", value: inProgressTickets, icon: "clock", color: "#FFA63D", bg: "#FFA63D15" },
    { label: "مغلقة", value: closedTickets, icon: "check-circle", color: "#28A745", bg: "#28A74515" },
    { label: "الإجمالي", value: totalTickets, icon: "list", color: "#00ACC1", bg: "#00ACC115" },
  ];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "open":
        return { label: "مفتوحة", color: "#DC3545", bg: "#DC354515", icon: "alert-circle" };
      case "in_progress":
        return { label: "قيد المعالجة", color: "#FFA63D", bg: "#FFA63D15", icon: "clock" };
      case "closed":
        return { label: "مغلقة", color: "#28A745", bg: "#28A74515", icon: "check-circle" };
      default:
        return { label: status, color: "#6C757D", bg: "#6C757D15", icon: "circle" };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "high":
        return { label: "عالية", color: "#DC3545", bg: "#DC354515", icon: "alert-triangle" };
      case "medium":
        return { label: "متوسطة", color: "#FFA63D", bg: "#FFA63D15", icon: "alert-circle" };
      case "low":
        return { label: "منخفضة", color: "#28A745", bg: "#28A74515", icon: "info" };
      default:
        return { label: priority, color: "#6C757D", bg: "#6C757D15", icon: "circle" };
    }
  };

  const handleTicketPress = (ticket: Ticket) => {
    Haptics.selectionAsync();
   router.push({ pathname: "/support_ticket_details", params: { id: ticket.id } })
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: "#00ACC1", paddingTop: topPad + 16 }]}>
          <Text style={styles.headerGreeting}>مرحباً 👋</Text>
          <Text style={styles.headerName}>{user?.fullName || "فريق الدعم الفني"}</Text>
          <Text style={styles.headerSub}>لوحة تحكم الدعم الفني</Text>
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

        {/* Recent Tickets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📋 آخر التذاكر</Text>
            <TouchableOpacity onPress={() => router.push("/(support)/tickets")} activeOpacity={0.7}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل ({totalTickets})</Text>
            </TouchableOpacity>
          </View>

          {recentTickets.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="inbox" size={40} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textGray }]}>لا توجد تذاكر حالياً</Text>
            </View>
          ) : (
            recentTickets.map((ticket) => {
              const status = getStatusConfig(ticket.status);
              const priority = getPriorityConfig(ticket.priority);
              return (
                <TouchableOpacity
                  key={ticket.id}
                  style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleTicketPress(ticket)}
                  activeOpacity={0.7}
                >
                  <View style={styles.ticketHeader}>
                    <Text style={[styles.ticketTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {ticket.title}
                    </Text>
                    <View style={[styles.ticketStatus, { backgroundColor: status.bg }]}>
                      <Feather name={status.icon as any} size={10} color={status.color} />
                      <Text style={[styles.ticketStatusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>

                  <View style={styles.ticketInfo}>
                    <View style={styles.ticketInfoItem}>
                      <Feather name="user" size={12} color={colors.textGray} />
                      <Text style={[styles.ticketUser, { color: colors.textGray }]} numberOfLines={1}>
                        {ticket.user}
                      </Text>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
                      <Feather name={priority.icon as any} size={10} color={priority.color} />
                      <Text style={[styles.priorityText, { color: priority.color }]}>أولوية {priority.label}</Text>
                    </View>
                  </View>

                  <View style={styles.ticketFooter}>
                    <View style={styles.ticketDateItem}>
                      <Feather name="calendar" size={10} color={colors.textLight} />
                      <Text style={[styles.ticketDate, { color: colors.textLight }]}>{ticket.date}</Text>
                    </View>
                    <Feather name="chevron-left" size={14} color={colors.textLight} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>⚡ إجراءات سريعة</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/(support)/tickets")}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#00ACC115" }]}>
                <Feather name="list" size={20} color="#00ACC1" />
              </View>
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>جميع التذاكر</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/faq")}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#6C63FF15" }]}>
                <Feather name="help-circle" size={20} color="#6C63FF" />
              </View>
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>الأسئلة الشائعة</Text>
            </TouchableOpacity>
          </View>
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
  statCard: { width: "47%", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, textAlign: "center" },
  
  // Section
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  seeAll: { fontSize: 13, fontWeight: "600" },
  
  // Ticket Card
  ticketCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginBottom: 8 },
  ticketHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  ticketTitle: { fontSize: 14, fontWeight: "700", flex: 1 },
  ticketStatus: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  ticketStatusText: { fontSize: 10, fontWeight: "600" },
  ticketInfo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ticketInfoItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  ticketUser: { fontSize: 12 },
  priorityBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  priorityText: { fontSize: 9, fontWeight: "600" },
  ticketFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  ticketDateItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  ticketDate: { fontSize: 10 },
  
  // Empty State
  emptyState: { alignItems: "center", paddingVertical: 30, borderRadius: 14, borderWidth: 1, gap: 8 },
  emptyText: { fontSize: 13 },
  
  // Quick Actions
  actionsGrid: { flexDirection: "row", gap: 12 },
  actionCard: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  actionLabel: { fontSize: 13, fontWeight: "600" },
});