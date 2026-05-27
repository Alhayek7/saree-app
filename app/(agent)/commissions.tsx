// app/(agent)/commissions.tsx
import { useAuth } from "@/context/AuthContext";
import { useAgent, type WithdrawMethod } from "@/context/AgentContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState, useMemo } from "react";
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { LineChart } from "react-native-chart-kit";

const AGENT_COLOR = "#9C27B0";
const AGENT_DARK = "#6A1B9A";
const { width } = Dimensions.get("window");

const METHODS: { key: WithdrawMethod; label: string; desc: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "cash", label: "نقداً من المكتب", desc: "استلام يدوي خلال 24 ساعة", icon: "dollar-sign" },
  { key: "wallet", label: "محفظة إلكترونية", desc: "تحويل لجوال أو محفظة سريع", icon: "smartphone" },
  { key: "bank", label: "تحويل بنكي", desc: "خلال 2–3 أيام عمل", icon: "credit-card" },
];

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

const MIN_WITHDRAW = 10;

export default function AgentCommissionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sales, withdrawals, stats, requestWithdraw } = useAgent();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [tab, setTab] = useState<"commissions" | "withdrawals">("commissions");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [method, setMethod] = useState<WithdrawMethod>("cash");
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("week");

  const available = stats.availableCommission;
  const canWithdraw = available >= MIN_WITHDRAW;

  // بيانات الرسم البياني
  const chartData = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
    
    let filtered = sales;
    if (selectedPeriod === "week") {
      filtered = sales.filter(s => s.createdAt >= weekAgo);
    } else if (selectedPeriod === "month") {
      filtered = sales.filter(s => s.createdAt >= monthAgo);
    }
    
    // تجميع حسب اليوم
    const dailyMap = new Map<string, number>();
    filtered.forEach(sale => {
      const day = new Date(sale.createdAt).toLocaleDateString("ar-EG");
      dailyMap.set(day, (dailyMap.get(day) || 0) + sale.commission);
    });
    
    const days = Array.from(dailyMap.keys()).slice(-7);
    const commissions = days.map(d => dailyMap.get(d) || 0);
    
    return {
      labels: days.map(d => d.slice(0, 5)),
      datasets: [{ data: commissions.length ? commissions : [0] }],
    };
  }, [sales, selectedPeriod]);

  const showToast = (msg: string) => {
    Alert.alert("تنبيه", msg);
  };

  const openWithdraw = () => {
    if (!canWithdraw) {
      Alert.alert("تنبيه", `الحد الأدنى للسحب ${MIN_WITHDRAW} ₪`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    setWithdrawOpen(true);
  };

  const handleWithdraw = async () => {
    setSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 700));
      await requestWithdraw(available, method);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setWithdrawOpen(false);
      setSuccessOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Header مع بطاقة الرصيد */}
        <View style={[styles.header, { backgroundColor: AGENT_COLOR, paddingTop: topPad + 14 }]}>
          <Text style={styles.headerTitle}>أرباحي</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>إجمالي الأرباح</Text>
              <Text style={styles.statValue}>{stats.totalCommission.toFixed(2)} ₪</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>قيد المعالجة</Text>
              <Text style={[styles.statValue, { color: "#FFA63D" }]}>{stats.pendingCommission.toFixed(2)} ₪</Text>
            </View>
          </View>

          {/* بطاقة الرصيد المتاح */}
          <TouchableOpacity style={styles.balanceCard} onPress={openWithdraw} activeOpacity={0.9}>
            <View>
              <Text style={styles.balanceLabel}>الرصيد المتاح للسحب</Text>
              <Text style={styles.balanceValue}>{available.toFixed(2)} <Text style={styles.currency}>₪</Text></Text>
              {!canWithdraw && (
                <Text style={styles.balanceHint}>الحد الأدنى {MIN_WITHDRAW} ₪</Text>
              )}
            </View>
            <View style={[styles.withdrawBtn, { backgroundColor: canWithdraw ? "#fff" : "rgba(255,255,255,0.5)" }]}>
              <Feather name="arrow-up-circle" size={20} color={AGENT_DARK} />
              <Text style={[styles.withdrawText, { color: AGENT_DARK }]}>سحب</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* الرسم البياني */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📈 تطور الأرباح</Text>
            <View style={styles.periodSelector}>
              {[
                { key: "week", label: "أسبوع" },
                { key: "month", label: "شهر" },
                { key: "all", label: "الكل" },
              ].map(p => (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.periodBtn, selectedPeriod === p.key && { backgroundColor: AGENT_COLOR }]}
                  onPress={() => setSelectedPeriod(p.key as any)}
                >
                  <Text style={[styles.periodText, selectedPeriod === p.key && { color: "#fff" }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={chartData}
              width={Math.max(width - 60, chartData.labels.length * 60)}
              height={180}
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
                labelColor: (opacity = 1) => colors.textGray,
                style: { borderRadius: 16 },
                propsForDots: { r: "4", strokeWidth: "2", stroke: AGENT_COLOR },
              }}
              bezier
              style={styles.chart}
              formatYLabel={(value) => `${parseFloat(value).toFixed(0)}`}
            />
          </ScrollView>
        </View>

        {/* التبويبات */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, tab === "commissions" && { borderBottomColor: AGENT_COLOR, borderBottomWidth: 2 }]}
            onPress={() => setTab("commissions")}
          >
            <Feather name="trending-up" size={16} color={tab === "commissions" ? AGENT_COLOR : colors.textGray} />
            <Text style={[styles.tabText, { color: tab === "commissions" ? AGENT_COLOR : colors.textGray }]}>
              العمولات ({sales.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "withdrawals" && { borderBottomColor: AGENT_COLOR, borderBottomWidth: 2 }]}
            onPress={() => setTab("withdrawals")}
          >
            <Feather name="clock" size={16} color={tab === "withdrawals" ? AGENT_COLOR : colors.textGray} />
            <Text style={[styles.tabText, { color: tab === "withdrawals" ? AGENT_COLOR : colors.textGray }]}>
              السحوبات ({withdrawals.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* قائمة العمولات */}
        {tab === "commissions" && (
          <View style={styles.listContainer}>
            {sales.length === 0 ? (
              <EmptyBlock
                colors={colors}
                icon="trending-up"
                title="لا توجد عمولات بعد"
                text="ابدأ ببيع باقاتك للعملاء وستظهر عمولاتك هنا"
              />
            ) : (
              sales.map((item) => (
                <View key={item.id} style={[styles.commissionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.commissionIcon}>
                    <Feather name="trending-up" size={18} color={AGENT_COLOR} />
                  </View>
                  <View style={styles.commissionInfo}>
                    <Text style={[styles.commissionTitle, { color: colors.foreground }]}>
                      باقة {item.packageOrders} طلب
                    </Text>
                    <Text style={[styles.commissionDate, { color: colors.textGray }]}>
                      {item.customerPhone} • {timeAgo(item.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.commissionAmount}>
                    <Text style={[styles.amountValue, { color: AGENT_COLOR }]}>+{item.commission} ₪</Text>
                    <Text style={[styles.amountPrice, { color: colors.textLight }]}>{item.price} ₪</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* قائمة السحوبات */}
        {tab === "withdrawals" && (
          <View style={styles.listContainer}>
            {withdrawals.length === 0 ? (
              <EmptyBlock
                colors={colors}
                icon="arrow-up-circle"
                title="لا توجد طلبات سحب"
                text="اطلب سحب عمولتك متى وصلت للحد الأدنى"
              />
            ) : (
              withdrawals.map((w) => {
                const meta = METHODS.find(m => m.key === w.method)!;
                const statusConfig = {
                  paid: { label: "مدفوعة", color: "#28A745", bg: "#E8F5E9", icon: "check-circle" },
                  pending: { label: "قيد المعالجة", color: "#FFA63D", bg: "#FFF8E1", icon: "clock" },
                  rejected: { label: "مرفوضة", color: "#DC3545", bg: "#FFEBEE", icon: "x-circle" },
                }[w.status];
                
                return (
                  <View key={w.id} style={[styles.withdrawalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.withdrawalIcon, { backgroundColor: statusConfig.bg }]}>
                      <Feather name={statusConfig.icon as any} size={18} color={statusConfig.color} />
                    </View>
                    <View style={styles.withdrawalInfo}>
                      <Text style={[styles.withdrawalTitle, { color: colors.foreground }]}>{meta.label}</Text>
                      <Text style={[styles.withdrawalDate, { color: colors.textGray }]}>{timeAgo(w.createdAt)}</Text>
                    </View>
                    <View style={styles.withdrawalAmount}>
                      <Text style={[styles.amountValue, { color: colors.foreground }]}>{w.amount.toFixed(2)} ₪</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* نصائح */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
         <Feather name="info" size={16} color={AGENT_COLOR} />

          <Text style={[styles.tipsText, { color: colors.textGray }]}>
            💡 كلما زادت مبيعاتك، زادت أرباحك! ركز على بيع الباقات الكبيرة لتحصل على عمولة أعلى.
          </Text>
        </View>
      </ScrollView>

      {/* مودال طلب السحب */}
      <Modal transparent animationType="fade" visible={withdrawOpen} onRequestClose={() => !submitting && setWithdrawOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>طلب سحب العمولة</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textGray }]}>اختر طريقة الاستلام المناسبة</Text>

            <View style={[styles.amountBox, { backgroundColor: AGENT_COLOR + "10", borderColor: AGENT_COLOR + "30" }]}>
              <Text style={[styles.amountLabel, { color: colors.textGray }]}>المبلغ المراد سحبه</Text>
              <Text style={[styles.amountValueModal, { color: AGENT_COLOR }]}>{available.toFixed(2)} ₪</Text>
            </View>

            <Text style={[styles.methodsLabel, { color: colors.foreground }]}>طريقة الاستلام</Text>
            {METHODS.map((m) => {
              const selected = method === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.methodRow, {
                    borderColor: selected ? AGENT_COLOR : colors.border,
                    backgroundColor: selected ? AGENT_COLOR + "0E" : "transparent",
                  }]}
                  onPress={() => setMethod(m.key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.methodIcon, { backgroundColor: selected ? AGENT_COLOR : AGENT_COLOR + "18" }]}>
                    <Feather name={m.icon} size={18} color={selected ? "#fff" : AGENT_COLOR} />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={[styles.methodTitle, { color: colors.foreground }]}>{m.label}</Text>
                    <Text style={[styles.methodDesc, { color: colors.textGray }]}>{m.desc}</Text>
                  </View>
                  <View style={[styles.radio, { borderColor: selected ? AGENT_COLOR : colors.border }]}>
                    {selected && <View style={[styles.radioDot, { backgroundColor: AGENT_COLOR }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setWithdrawOpen(false)}
                disabled={submitting}
              >
                <Text style={[styles.modalCancelText, { color: colors.foreground }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: AGENT_COLOR, opacity: submitting ? 0.7 : 1 }]}
                onPress={handleWithdraw}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>تأكيد الطلب</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* مودال النجاح */}
      <Modal transparent animationType="fade" visible={successOpen} onRequestClose={() => setSuccessOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.successCard, { backgroundColor: colors.card }]}>
            <View style={[styles.successIcon, { backgroundColor: "#E8F5E9" }]}>
              <Feather name="check-circle" size={40} color="#28A745" />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>تم تقديم الطلب بنجاح!</Text>
            <Text style={[styles.successText, { color: colors.textGray }]}>
              سيتم مراجعة طلبك خلال 24 ساعة وستصلك العمولة وفق الطريقة المختارة.
            </Text>
            <TouchableOpacity
              style={[styles.successBtn, { backgroundColor: AGENT_COLOR }]}
              onPress={() => setSuccessOpen(false)}
            >
              <Text style={styles.successBtnText}>حسناً</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function EmptyBlock({ colors, icon, title, text }: { colors: any; icon: keyof typeof Feather.glyphMap; title: string; text: string }) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: AGENT_COLOR + "15" }]}>
        <Feather name={icon} size={32} color={AGENT_COLOR} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyText, { color: colors.textGray }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  
  header: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 16 },
  
  statsGrid: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  statCard: { flex: 1, alignItems: "center" },
  statLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginBottom: 4 },
  statValue: { color: "#fff", fontSize: 20, fontWeight: "800" },
  statDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)" },
  
  balanceCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 16, padding: 16 },
  balanceLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  balanceValue: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 4 },
  currency: { fontSize: 16, fontWeight: "700" },
  balanceHint: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 },
  withdrawBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  withdrawText: { fontSize: 14, fontWeight: "700" },
  
  chartCard: { margin: 16, marginTop: 20, padding: 12, borderRadius: 16, borderWidth: 1 },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  periodSelector: { flexDirection: "row", gap: 8 },
  periodBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  periodText: { fontSize: 11, fontWeight: "600" },
  chart: { marginVertical: 8, borderRadius: 16 },
  
  tabsContainer: { flexDirection: "row", marginHorizontal: 16, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "#E5E5E5" },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: "600" },
  
  listContainer: { paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  
  commissionCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  commissionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: AGENT_COLOR + "15", justifyContent: "center", alignItems: "center" },
  commissionInfo: { flex: 1 },
  commissionTitle: { fontSize: 14, fontWeight: "700" },
  commissionDate: { fontSize: 11, marginTop: 2 },
  commissionAmount: { alignItems: "flex-end" },
  amountValue: { fontSize: 16, fontWeight: "800" },
  amountPrice: { fontSize: 11, marginTop: 2 },
  
  withdrawalCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  withdrawalIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  withdrawalInfo: { flex: 1 },
  withdrawalTitle: { fontSize: 14, fontWeight: "700" },
  withdrawalDate: { fontSize: 11, marginTop: 2 },
  withdrawalAmount: { alignItems: "flex-end", gap: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "700" },
  
  tipsCard: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: 14, borderWidth: 1 },
  tipsText: { fontSize: 12, flex: 1, lineHeight: 18 },
  
  emptyCard: { alignItems: "center", padding: 40, borderRadius: 16, borderWidth: 1, marginTop: 20 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  emptyText: { fontSize: 12, textAlign: "center" },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end", alignItems: "center" },
  modalSheet: { width: "100%", maxWidth: 440, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E5E5", alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  modalSubtitle: { fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 16 },
  amountBox: { padding: 16, borderRadius: 14, borderWidth: 1, alignItems: "center", marginBottom: 16 },
  amountLabel: { fontSize: 12 },
  amountValueModal: { fontSize: 28, fontWeight: "800" },
  methodsLabel: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  methodRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
  methodIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  methodInfo: { flex: 1 },
  methodTitle: { fontSize: 14, fontWeight: "700" },
  methodDesc: { fontSize: 11, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 16 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  modalCancelText: { fontSize: 14, fontWeight: "600" },
  modalConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  modalConfirmText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  
  successCard: { width: "85%", borderRadius: 20, padding: 24, alignItems: "center" },
  successIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  successText: { fontSize: 14, textAlign: "center", marginBottom: 20 },
  successBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  successBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});