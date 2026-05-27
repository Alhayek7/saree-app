import { useAuth } from "@/context/AuthContext";
import { useAgent } from "@/context/AgentContext";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const AGENT_COLOR = "#9C27B0";
const AGENT_DARK = "#6A1B9A";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  const d = Math.floor(h / 24);
  return `قبل ${d} يوم`;
}

export default function AgentHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sales, stats } = useAgent();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const todaySales = sales.filter(s => s.createdAt >= start.getTime());
    return {
      count: todaySales.length,
      commission: todaySales.reduce((acc, s) => acc + s.commission, 0),
    };
  }, [sales]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: AGENT_COLOR, paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>مرحباً 👋</Text>
            <Text style={styles.agentName} numberOfLines={1}>{user?.fullName ?? "الوكيل"}</Text>
            <View style={styles.neighborhoodPill}>
              <Feather name="map-pin" size={11} color="#fff" />
              <Text style={styles.neighborhoodText}>{user?.neighborhood ?? "غزة"}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.agentCodeBadge}
            onPress={() => router.push("/(agent)/codes" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.agentCodeLabel}>كود الوكيل</Text>
            <Text style={styles.agentCode}>{user?.agentCode ?? "AGT001"}</Text>
            <View style={styles.activePill}>
              <View style={[styles.dot, { backgroundColor: user?.isActive ? "#4ADE80" : "#FCA5A5" }]} />
              <Text style={styles.activeText}>{user?.isActive ? "نشط" : "موقوف"}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Big balance card */}
        <View style={styles.balanceCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.balanceLabel}>الرصيد المتاح للسحب</Text>
            <Text style={styles.balanceVal}>
              {stats.availableCommission.toFixed(2)} <Text style={styles.currency}>₪</Text>
            </Text>
            <View style={styles.balanceSubRow}>
              <View style={styles.balanceSub}>
                <Feather name="clock" size={11} color="rgba(255,255,255,0.85)" />
                <Text style={styles.balanceSubText}>قيد المعالجة: {stats.pendingCommission.toFixed(2)} ₪</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.withdrawMini}
            onPress={() => router.push("/(agent)/commissions" as any)}
            activeOpacity={0.85}
          >
            <Feather name="arrow-up-circle" size={16} color={AGENT_DARK} />
            <Text style={styles.withdrawMiniText}>سحب</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today stats */}
      <View style={styles.todayWrap}>
        <View style={[styles.todayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.todayIcon, { backgroundColor: AGENT_COLOR + "18" }]}>
            <Feather name="shopping-bag" size={18} color={AGENT_COLOR} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.todayLabel, { color: colors.textGray }]}>مبيعات اليوم</Text>
            <Text style={[styles.todayVal, { color: colors.foreground }]}>{today.count} <Text style={[styles.todayUnit, { color: colors.textGray }]}>عملية</Text></Text>
          </View>
        </View>
        <View style={[styles.todayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.todayIcon, { backgroundColor: "#FFA63D18" }]}>
            <Feather name="dollar-sign" size={18} color="#FFA63D" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.todayLabel, { color: colors.textGray }]}>عمولة اليوم</Text>
            <Text style={[styles.todayVal, { color: colors.foreground }]}>{today.commission.toFixed(2)} <Text style={[styles.todayUnit, { color: colors.textGray }]}>₪</Text></Text>
          </View>
        </View>
      </View>

      {/* Lifetime stats strip */}
      <View style={[styles.lifeStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          { label: "إجمالي المبيعات", val: stats.totalSales, icon: "trending-up" as const },
          { label: "أكواد متاحة", val: stats.availableCodes, icon: "tag" as const },
          { label: "إجمالي العمولة", val: `${stats.totalCommission.toFixed(1)}₪`, icon: "award" as const },
        ].map((s, i) => (
          <React.Fragment key={s.label}>
            <View style={styles.lifeItem}>
              <Feather name={s.icon} size={14} color={AGENT_COLOR} />
              <Text style={[styles.lifeVal, { color: colors.foreground }]}>{s.val}</Text>
              <Text style={[styles.lifeLbl, { color: colors.textGray }]}>{s.label}</Text>
            </View>
            {i < 2 && <View style={[styles.lifeDivider, { backgroundColor: colors.border }]} />}
          </React.Fragment>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>إجراءات سريعة</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: "بيع باقة", icon: "shopping-cart" as const, color: "#28A745", route: "/(agent)/sell", desc: "بيع لعميل جديد" },
            { label: "إنشاء كود", icon: "plus-square" as const, color: "#6C63FF", route: "/(agent)/codes", desc: "كود تفعيل" },
            { label: "سحب عمولة", icon: "arrow-up-circle" as const, color: "#FFA63D", route: "/(agent)/commissions", desc: "اطلب السحب" },
            { label: "سجل المبيعات", icon: "list" as const, color: AGENT_COLOR, route: "/(agent)/commissions", desc: "العمليات السابقة" },
          ].map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(a.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color + "18" }]}>
                <Feather name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>{a.label}</Text>
              <Text style={[styles.actionDesc, { color: colors.textGray }]}>{a.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Sales */}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>آخر المبيعات</Text>
          {sales.length > 3 && (
            <TouchableOpacity onPress={() => router.push("/(agent)/commissions" as any)}>
              <Text style={[styles.seeAll, { color: AGENT_COLOR }]}>عرض الكل</Text>
            </TouchableOpacity>
          )}
        </View>
        {sales.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: AGENT_COLOR + "15" }]}>
              <Feather name="inbox" size={28} color={AGENT_COLOR} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد مبيعات بعد</Text>
            <Text style={[styles.emptyText, { color: colors.textGray }]}>ابدأ ببيع أول باقة لعميل واكسب عمولتك</Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: AGENT_COLOR }]}
              onPress={() => router.push("/(agent)/sell" as any)}
              activeOpacity={0.85}
            >
              <Feather name="shopping-cart" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>بيع باقة الآن</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sales.slice(0, 4).map((item) => (
            <View key={item.id} style={[styles.commCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.commIcon, { backgroundColor: AGENT_COLOR + "18" }]}>
                <Feather name="trending-up" size={18} color={AGENT_COLOR} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.commType, { color: colors.foreground }]}>باقة {item.packageOrders} طلب</Text>
                <Text style={[styles.commDate, { color: colors.textGray }]}>{item.customerPhone} • {timeAgo(item.createdAt)}</Text>
              </View>
              <Text style={[styles.commAmount, { color: AGENT_COLOR }]}>+{item.commission} ₪</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 12 },
  greeting: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  agentName: { color: "#fff", fontSize: 20, fontWeight: "700", marginTop: 2 },
  neighborhoodPill: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, backgroundColor: "rgba(255,255,255,0.18)", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  neighborhoodText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  agentCodeBadge: { padding: 10, borderRadius: 14, alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", gap: 4, minWidth: 100 },
  agentCodeLabel: { color: "rgba(255,255,255,0.85)", fontSize: 10 },
  agentCode: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },
  activePill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.18)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  activeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  balanceCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 16, padding: 14, gap: 10 },
  balanceLabel: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  balanceVal: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 4 },
  currency: { fontSize: 16, fontWeight: "700" },
  balanceSubRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  balanceSub: { flexDirection: "row", alignItems: "center", gap: 4 },
  balanceSubText: { color: "rgba(255,255,255,0.85)", fontSize: 11 },
  withdrawMini: { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  withdrawMiniText: { color: AGENT_DARK, fontSize: 13, fontWeight: "800" },

  todayWrap: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: -14, marginBottom: 12 },
  todayCard: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  todayIcon: { width: 38, height: 38, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  todayLabel: { fontSize: 11 },
  todayVal: { fontSize: 17, fontWeight: "800", marginTop: 2 },
  todayUnit: { fontSize: 12, fontWeight: "600" },

  lifeStrip: { marginHorizontal: 16, marginBottom: 8, borderRadius: 14, borderWidth: 1, flexDirection: "row", paddingVertical: 12, alignItems: "center" },
  lifeItem: { flex: 1, alignItems: "center", gap: 2 },
  lifeVal: { fontSize: 15, fontWeight: "800", marginTop: 2 },
  lifeLbl: { fontSize: 10 },
  lifeDivider: { width: 1, height: 32 },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  seeAll: { fontSize: 13, fontWeight: "700" },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionCard: { width: "47.5%", padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "flex-start", gap: 8 },
  actionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  actionLabel: { fontSize: 14, fontWeight: "700" },
  actionDesc: { fontSize: 11 },

  commCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  commIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  commType: { fontSize: 14, fontWeight: "700" },
  commDate: { fontSize: 12, marginTop: 2 },
  commAmount: { fontSize: 16, fontWeight: "800" },

  emptyCard: { padding: 24, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptyText: { fontSize: 12, textAlign: "center", marginTop: 4, marginBottom: 14 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  emptyBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
