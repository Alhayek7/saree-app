import { useAuth } from "@/context/AuthContext";
import { useAgent, type WithdrawMethod } from "@/context/AgentContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const AGENT_COLOR = "#9C27B0";
const AGENT_DARK = "#6A1B9A";

const METHODS: { key: WithdrawMethod; label: string; desc: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "cash",   label: "نقداً من المكتب", desc: "استلام يدوي خلال 24 ساعة", icon: "dollar-sign" },
  { key: "wallet", label: "محفظة إلكترونية", desc: "تحويل لجوال أو محفظة سريع",  icon: "smartphone" },
  { key: "bank",   label: "تحويل بنكي",       desc: "خلال 2–3 أيام عمل",         icon: "credit-card" },
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
  const [toast, setToast] = useState<string | null>(null);

  const available = stats.availableCommission;
  const canWithdraw = available >= MIN_WITHDRAW;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const openWithdraw = () => {
    if (!canWithdraw) {
      showToast(`الحد الأدنى للسحب ${MIN_WITHDRAW} ₪`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(()=>{});
      return;
    }
    setWithdrawOpen(true);
  };

  const handleWithdraw = async () => {
    setSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 700));
      await requestWithdraw(available, method);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});
      setWithdrawOpen(false);
      setSuccessOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with balance */}
        <View style={[styles.header, { backgroundColor: AGENT_COLOR, paddingTop: topPad + 14 }]}>
          <Text style={styles.headerTitle}>عمولاتي</Text>

          <View style={styles.balanceCard}>
            <View>
              <Text style={styles.balanceLabel}>متاح للسحب</Text>
              <Text style={styles.balanceVal}>
                {available.toFixed(2)} <Text style={styles.currency}>₪</Text>
              </Text>
            </View>
            <View style={styles.balanceRight}>
              <View style={styles.miniStat}>
                <Text style={styles.miniLabel}>إجمالي</Text>
                <Text style={styles.miniVal}>{stats.totalCommission.toFixed(2)} ₪</Text>
              </View>
              <View style={styles.miniDivider} />
              <View style={styles.miniStat}>
                <Text style={styles.miniLabel}>قيد المعالجة</Text>
                <Text style={styles.miniVal}>{stats.pendingCommission.toFixed(2)} ₪</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.withdrawBtn, !canWithdraw && { opacity: 0.85 }]}
            onPress={openWithdraw}
            activeOpacity={0.85}
          >
            <Feather name="arrow-up-circle" size={18} color={AGENT_DARK} />
            <Text style={[styles.withdrawText, { color: AGENT_DARK }]}>
              {canWithdraw ? "طلب سحب العمولة" : `الحد الأدنى ${MIN_WITHDRAW} ₪`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {([
            { key: "commissions" as const, label: `العمولات (${sales.length})` },
            { key: "withdrawals" as const, label: `السحوبات (${withdrawals.length})` },
          ]).map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => { setTab(t.key); Haptics.selectionAsync().catch(()=>{}); }}
              style={[styles.tab, tab === t.key && { borderBottomColor: AGENT_COLOR }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: tab === t.key ? AGENT_COLOR : colors.textGray }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ padding: 16 }}>
          {tab === "commissions" ? (
            sales.length === 0 ? (
              <EmptyBlock
                colors={colors}
                icon="trending-up"
                title="لا توجد عمولات بعد"
                text="ابدأ ببيع باقاتك للعملاء وستظهر عموالتك هنا"
              />
            ) : (
              sales.map((item) => (
                <View key={item.id} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.rowIcon, { backgroundColor: AGENT_COLOR + "18" }]}>
                    <Feather name="trending-up" size={18} color={AGENT_COLOR} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.foreground }]}>بيع باقة {item.packageOrders} طلب</Text>
                    <Text style={[styles.rowSub, { color: colors.textGray }]}>
                      {item.customerPhone} • {timeAgo(item.createdAt)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.rowAmount, { color: AGENT_COLOR }]}>+{item.commission} ₪</Text>
                    <Text style={[styles.rowMeta, { color: colors.textLight }]}>من {item.price} ₪</Text>
                  </View>
                </View>
              ))
            )
          ) : (
            withdrawals.length === 0 ? (
              <EmptyBlock
                colors={colors}
                icon="arrow-up-circle"
                title="لا توجد طلبات سحب"
                text="اطلب سحب عمولتك متى وصلت للحد الأدنى"
              />
            ) : (
              withdrawals.map((w) => {
                const meta = METHODS.find(m => m.key === w.method)!;
                const sColor = w.status === "paid" ? "#28A745" : w.status === "rejected" ? "#DC3545" : "#FFA63D";
                const sBg = w.status === "paid" ? "#E8F5E9" : w.status === "rejected" ? "#FFEBEE" : "#FFF8E1";
                const sLbl = w.status === "paid" ? "مدفوعة" : w.status === "rejected" ? "مرفوضة" : "قيد المعالجة";
                return (
                  <View key={w.id} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.rowIcon, { backgroundColor: AGENT_COLOR + "18" }]}>
                      <Feather name={meta.icon} size={18} color={AGENT_COLOR} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: colors.foreground }]}>طلب سحب – {meta.label}</Text>
                      <Text style={[styles.rowSub, { color: colors.textGray }]}>{timeAgo(w.createdAt)}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Text style={[styles.rowAmount, { color: colors.foreground }]}>{w.amount.toFixed(2)} ₪</Text>
                      <View style={[styles.statusBadge, { backgroundColor: sBg }]}>
                        <Text style={{ color: sColor, fontSize: 10, fontWeight: "800" }}>{sLbl}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )
          )}
        </View>
      </ScrollView>

      {/* Toast */}
      {toast && (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toast}>
            <Feather name="info" size={16} color="#fff" />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      )}

      {/* Withdraw modal */}
      <Modal transparent animationType="fade" visible={withdrawOpen} onRequestClose={() => !submitting && setWithdrawOpen(false)}>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.sheet, { backgroundColor: colors.card }]}>
            <View style={modalStyles.handle} />
            <Text style={[modalStyles.title, { color: colors.foreground }]}>طلب سحب العمولة</Text>
            <Text style={[modalStyles.subtitle, { color: colors.textGray }]}>اختر طريقة استلام مناسبة</Text>

            <View style={[modalStyles.amountBox, { backgroundColor: AGENT_COLOR + "10", borderColor: AGENT_COLOR + "30" }]}>
              <Text style={[modalStyles.amountLbl, { color: colors.textGray }]}>المبلغ</Text>
              <Text style={[modalStyles.amountVal, { color: AGENT_COLOR }]}>{available.toFixed(2)} ₪</Text>
            </View>

            <Text style={[modalStyles.sectionLbl, { color: colors.foreground }]}>طريقة الاستلام</Text>
            {METHODS.map((m) => {
              const selected = method === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[modalStyles.methodRow, {
                    borderColor: selected ? AGENT_COLOR : colors.border,
                    backgroundColor: selected ? AGENT_COLOR + "0E" : colors.background,
                  }]}
                  onPress={() => { setMethod(m.key); Haptics.selectionAsync().catch(()=>{}); }}
                  activeOpacity={0.8}
                >
                  <View style={[modalStyles.methodIcon, { backgroundColor: selected ? AGENT_COLOR : AGENT_COLOR + "18" }]}>
                    <Feather name={m.icon} size={18} color={selected ? "#fff" : AGENT_COLOR} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[modalStyles.methodTitle, { color: colors.foreground }]}>{m.label}</Text>
                    <Text style={[modalStyles.methodDesc, { color: colors.textGray }]}>{m.desc}</Text>
                  </View>
                  <View style={[modalStyles.radio, { borderColor: selected ? AGENT_COLOR : colors.border }]}>
                    {selected && <View style={[modalStyles.radioDot, { backgroundColor: AGENT_COLOR }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                style={[modalStyles.btnSecondary, { borderColor: colors.border }]}
                onPress={() => setWithdrawOpen(false)}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text style={[modalStyles.btnSecondaryTxt, { color: colors.foreground }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.btn, { backgroundColor: AGENT_COLOR, flex: 1, opacity: submitting ? 0.7 : 1 }]}
                onPress={handleWithdraw}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Text style={modalStyles.btnText}>{submitting ? "جارٍ التأكيد..." : "تأكيد الطلب"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success modal */}
      <Modal transparent animationType="fade" visible={successOpen} onRequestClose={() => setSuccessOpen(false)}>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.card, { backgroundColor: colors.card }]}>
            <View style={[modalStyles.iconWrap, { backgroundColor: "#E8F5E9" }]}>
              <Feather name="check-circle" size={36} color="#28A745" />
            </View>
            <Text style={[modalStyles.title, { color: colors.foreground }]}>تم تقديم الطلب</Text>
            <Text style={[modalStyles.subtitle, { color: colors.textGray }]}>
              سيتم مراجعة طلبك خلال 24 ساعة وستصلك العمولة وفق الطريقة المختارة.
            </Text>
            <TouchableOpacity
              style={[modalStyles.btn, { backgroundColor: AGENT_COLOR, width: "100%", marginTop: 18 }]}
              onPress={() => setSuccessOpen(false)}
              activeOpacity={0.85}
            >
              <Text style={modalStyles.btnText}>تم</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function EmptyBlock({ colors, icon, title, text }: { colors: ReturnType<typeof useColors>; icon: keyof typeof Feather.glyphMap; title: string; text: string }) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: AGENT_COLOR + "15" }]}>
        <Feather name={icon} size={28} color={AGENT_COLOR} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyText, { color: colors.textGray }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 14 },
  balanceCard: { backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 16, padding: 16, marginBottom: 12 },
  balanceLabel: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  balanceVal: { color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 4 },
  currency: { fontSize: 18, fontWeight: "700" },
  balanceRight: { flexDirection: "row", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" },
  miniStat: { flex: 1 },
  miniLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  miniVal: { color: "#fff", fontSize: 14, fontWeight: "700", marginTop: 2 },
  miniDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 12 },

  withdrawBtn: { backgroundColor: "#fff", borderRadius: 12, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  withdrawText: { fontSize: 15, fontWeight: "800" },

  tabsRow: { flexDirection: "row", paddingHorizontal: 16, marginTop: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText: { fontSize: 13, fontWeight: "700" },

  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  rowIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  rowTitle: { fontSize: 14, fontWeight: "700" },
  rowSub: { fontSize: 12, marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: "800" },
  rowMeta: { fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },

  emptyCard: { padding: 24, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptyText: { fontSize: 12, textAlign: "center", marginTop: 4 },

  toastWrap: { position: "absolute", bottom: 100, left: 0, right: 0, alignItems: "center" },
  toast: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(0,0,0,0.85)", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  toastText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  sheet: { width: "100%", maxWidth: 440, borderRadius: 20, padding: 18 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#0001", alignSelf: "center", marginBottom: 10 },
  title: { fontSize: 19, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 13, marginTop: 6, textAlign: "center" },

  amountBox: { marginTop: 16, padding: 16, borderRadius: 14, borderWidth: 1, alignItems: "center", gap: 4 },
  amountLbl: { fontSize: 12 },
  amountVal: { fontSize: 28, fontWeight: "800" },

  sectionLbl: { fontSize: 14, fontWeight: "700", marginTop: 16, marginBottom: 10 },
  methodRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
  methodIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  methodTitle: { fontSize: 14, fontWeight: "700" },
  methodDesc: { fontSize: 11, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  radioDot: { width: 11, height: 11, borderRadius: 6 },

  card: { width: "100%", maxWidth: 380, borderRadius: 20, padding: 24, alignItems: "center" },
  iconWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", marginBottom: 14 },

  btn: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  btnSecondary: { paddingVertical: 14, paddingHorizontal: 22, borderRadius: 12, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  btnSecondaryTxt: { fontSize: 14, fontWeight: "700" },
});
