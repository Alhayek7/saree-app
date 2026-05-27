// app/(driver)/agents.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const MOCK_AGENTS = [
  {
    id: "1",
    name: "بقالة السلام",
    address: "الرمال - شارع الوحدة، مقابل مستشفى غزة",
    phone: "0598123456",
    location: "الرمال",
    hours: "9 صباحاً - 11 مساءً",
    rating: 4.8,
    reviews: 23,
    icon: "shopping-bag",
    workingDays: "السبت - الخميس",
  },
  {
    id: "2",
    name: "سوبر ماركت الفلاح",
    address: "الزيتون - دوار أبو حصيرة، بجانب مسجد الفلاح",
    phone: "0598223344",
    location: "الزيتون",
    hours: "8 صباحاً - 12 مساءً",
    rating: 4.5,
    reviews: 17,
    icon: "shopping-cart",
    workingDays: "السبت - الخميس",
  },
  {
    id: "3",
    name: "مكتب النور لخدمات التوصيل",
    address: "الشجاعية - شارع الثلاثيني، فوق صيدلية النور",
    phone: "0598334455",
    location: "الشجاعية",
    hours: "10 صباحاً - 10 مساءً",
    rating: 4.9,
    reviews: 42,
    icon: "briefcase",
    workingDays: "السبت - الخميس",
  },
  {
    id: "4",
    name: "ميني ماركت الهدى",
    address: "تل الهوى - شارع جمال عبد الناصر",
    phone: "0598445566",
    location: "تل الهوى",
    hours: "8 صباحاً - 11 مساءً",
    rating: 4.6,
    reviews: 31,
    icon: "shopping-bag",
    workingDays: "السبت - الخميس",
  },
  {
    id: "5",
    name: "مركز الوسيم للخدمات",
    address: "النسيم - شارع القدس، مجمع الوسيم التجاري",
    phone: "0598556677",
    location: "النسيم",
    hours: "9 صباحاً - 9 مساءً",
    rating: 4.7,
    reviews: 28,
    icon: "building",
    workingDays: "السبت - الخميس",
  },
];

export default function AgentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  
  const filteredAgents = MOCK_AGENTS.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.address.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleCall = (phone: string) => Linking.openURL(`tel:${phone}`);
  const handleNavigate = (address: string) => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
  
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<Feather key={i} name="star" size={12} color={i <= rating ? "#FFC107" : colors.border} />);
    }
    return <View style={{ flexDirection: "row", gap: 2 }}>{stars}</View>;
  };
  
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: "#28A745", paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>الوكلاء المعتمدون</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.infoBanner, { backgroundColor: "#E8F5E9", borderColor: "#A5D6A7" }]}>
        <Feather name="info" size={16} color="#28A745" />
        <Text style={[styles.infoText, { color: "#2E7D32" }]}>توجه لأي وكيل معتمد لشحن رصيدك نقداً</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={18} color={colors.textGray} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="ابحث باسم الوكيل أو المنطقة..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== "" && <TouchableOpacity onPress={() => setSearchQuery("")}><Feather name="x" size={18} color={colors.textGray} /></TouchableOpacity>}
      </View>

      <FlatList
        data={filteredAgents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="map-pin" size={48} color={colors.textLight} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد وكلاء</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.agentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.agentIcon, { backgroundColor: "#28A74515" }]}>
                <Feather name={item.icon as any} size={24} color="#28A745" />
              </View>
              <View style={styles.agentInfo}>
                <Text style={[styles.agentName, { color: colors.foreground }]}>{item.name}</Text>
                <View style={styles.ratingRow}>
                  {renderStars(item.rating)}
                  <Text style={[styles.ratingText, { color: colors.textGray }]}>{item.rating} ({item.reviews})</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.callBtn, { backgroundColor: "#28A745" }]} onPress={() => handleCall(item.phone)}>
                <Feather name="phone" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.infoRow}>
                <Feather name="map-pin" size={14} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.textGray }]}>{item.address}</Text>
              </View>
              <View style={styles.infoRow}>
                <Feather name="clock" size={14} color={colors.secondary} />
                <Text style={[styles.infoText, { color: colors.textGray }]}>{item.hours} • {item.workingDays}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.navigateBtn, { borderColor: colors.border }]} onPress={() => handleNavigate(item.address)}>
              <Feather name="navigation" size={16} color={colors.primary} />
              <Text style={[styles.navigateText, { color: colors.primary }]}>فتح في الخريطة</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 20 },
  backBtn: { padding: 4 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  infoBanner: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: 14, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 13 },
  searchContainer: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 16, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  agentCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12, marginHorizontal: 16, marginBottom: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  agentIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  agentInfo: { flex: 1 },
  agentName: { fontSize: 15, fontWeight: "700" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  ratingText: { fontSize: 11 },
  callBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  cardBody: { gap: 8 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  navigateBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginTop: 8 },
  navigateText: { fontSize: 12, fontWeight: "600" },
});