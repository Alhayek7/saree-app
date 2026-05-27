// app/(support)/tickets.tsx
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,  // ✅ أضف هذا
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MOCK_TICKETS = [
  { id: "1", user: "أحمد محمد", title: "مشكلة في تسجيل الدخول", status: "open", date: "2024-05-24" },
  { id: "2", user: "محمد سعيد", title: "تأخر في التوصيل", status: "in_progress", date: "2024-05-23" },
  { id: "3", user: "متجر الأمل", title: "مشكلة في إضافة منتج", status: "open", date: "2024-05-22" },
  { id: "4", user: "سامي نصر", title: "استفسار عن العمولة", status: "closed", date: "2024-05-21" },
  { id: "5", user: "خالد أحمد", title: "طلب تعديل بيانات", status: "open", date: "2024-05-20" },
];

export default function TicketsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const filteredTickets = MOCK_TICKETS.filter(ticket => {
    if (filter === "all") return true;
    return ticket.status === filter;
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "#DC3545";
      case "in_progress": return "#FFA63D";
      case "closed": return "#28A745";
      default: return "#6C757D";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open": return "مفتوحة";
      case "in_progress": return "قيد المعالجة";
      case "closed": return "مغلقة";
      default: return status;
    }
  };

  const filters = [
    { key: "all", label: "الكل" },
    { key: "open", label: "مفتوحة" },
    { key: "in_progress", label: "قيد المعالجة" },
    { key: "closed", label: "مغلقة" },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: "#00ACC1", paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>التذاكر</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filtersContainer}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f.key ? "#00ACC1" : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, { color: filter === f.key ? "#fff" : colors.textGray }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color={colors.textLight} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد تذاكر</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: "/support_ticket_details", params: { id: item.id } })}
          >
            <View style={styles.ticketHeader}>
              <Text style={[styles.ticketTitle, { color: colors.foreground }]}>{item.title}</Text>
              <View style={[styles.ticketStatus, { backgroundColor: getStatusColor(item.status) + "15" }]}>
                <Text style={[styles.ticketStatusText, { color: getStatusColor(item.status) }]}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
            <Text style={[styles.ticketUser, { color: colors.textGray }]}>{item.user}</Text>
            <Text style={[styles.ticketDate, { color: colors.textLight }]}>{item.date}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  filtersScroll: { flexGrow: 0 },
  filtersContainer: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: "600" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  ticketCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6, marginBottom: 8 },
  ticketHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ticketTitle: { fontSize: 14, fontWeight: "700", flex: 1 },
  ticketStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  ticketStatusText: { fontSize: 10, fontWeight: "600" },
  ticketUser: { fontSize: 12 },
  ticketDate: { fontSize: 11 },
});