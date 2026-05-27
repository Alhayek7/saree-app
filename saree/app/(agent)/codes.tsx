import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAgent, AGENT_PACKAGES, type AgentCode } from "@/context/AgentContext";

const AGENT_COLOR = "#9C27B0";

type FilterKey = "all" | "available" | "used";

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

async function copyText(text: string): Promise<boolean> {
  try {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  return false;
}

export default function AgentCodesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { codes, generateCode, deleteCode, stats } = useAgent();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [filter, setFilter] = useState<FilterKey>("all");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<AgentCode | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AgentCode | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const filtered = useMemo(() => {
    if (filter === "available") return codes.filter(c => !c.used);
    if (filter === "used") return codes.filter(c => c.used);
    return codes;
  }, [codes, filter]);

  const handleGenerate = async (packageId: number) => {
    setPickerOpen(false);
    setGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 400));
      const c = await generateCode(packageId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});
      setGenerated(c);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text: string) => {
    const ok = await copyText(text);
    showToast(ok ? "تم نسخ الكود ✓" : "اضغط مطوّلاً على الكود لنسخه");
    Haptics.selectionAsync().catch(()=>{});
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteCode(confirmDelete.id);
    setConfirmDelete(null);
    showToast("تم حذف الكود");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(()=>{});
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: AGENT_COLOR, paddingTop: topPad + 14 }]}>
        <View>
          <Text style={styles.headerTitle}>إدارة الأكواد</Text>
          <Text style={styles.headerSub}>أنشئ أكواد تفعيل وشاركها مع عملائك</Text>
        </View>
        <View style={styles.statsRow}>
          {[
            { lbl: "الكل", val: stats.totalCodes },
            { lbl: "متاحة", val: stats.availableCodes },
            { lbl: "مستخدمة", val: stats.usedCodes },
          ].map((s) => (
            <View key={s.lbl} style={styles.statItem}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Generate button */}
      <TouchableOpacity
        style={[styles.generateBtn, { backgroundColor: AGENT_COLOR, opacity: generating ? 0.7 : 1 }]}
        onPress={() => setPickerOpen(true)}
        disabled={generating}
        activeOpacity={0.85}
      >
        <Feather name={generating ? "loader" : "plus-circle"} size={20} color="#fff" />
        <Text style={styles.generateText}>{generating ? "جارٍ الإنشاء..." : "إنشاء كود جديد"}</Text>
      </TouchableOpacity>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {([
          { key: "all" as FilterKey, label: "الكل", count: stats.totalCodes },
          { key: "available" as FilterKey, label: "متاحة", count: stats.availableCodes },
          { key: "used" as FilterKey, label: "مستخدمة", count: stats.usedCodes },
        ]).map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => { setFilter(f.key); Haptics.selectionAsync().catch(()=>{}); }}
            activeOpacity={0.7}
            style={[styles.chip, {
              backgroundColor: filter === f.key ? AGENT_COLOR : colors.card,
              borderColor: filter === f.key ? AGENT_COLOR : colors.border,
            }]}
          >
            <Text style={[styles.chipText, { color: filter === f.key ? "#fff" : colors.foreground }]}>
              {f.label} ({f.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: AGENT_COLOR + "15" }]}>
              <Feather name="grid" size={28} color={AGENT_COLOR} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {filter === "all" ? "لا توجد أكواد بعد" : filter === "available" ? "لا توجد أكواد متاحة" : "لا توجد أكواد مستخدمة"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textGray }]}>
              {filter === "all" ? "ابدأ بإنشاء أول كود تفعيل" : "جرّب تغيير الفلتر"}
            </Text>
          </View>
        ) : (
          filtered.map((code) => (
            <View key={code.id} style={[styles.codeCard, { backgroundColor: colors.card, borderColor: code.used ? colors.border : AGENT_COLOR + "40" }]}>
              <View style={styles.codeRow}>
                <View style={[styles.codeIconBox, { backgroundColor: code.used ? colors.muted : AGENT_COLOR + "18" }]}>
                  <Feather name="grid" size={18} color={code.used ? colors.textGray : AGENT_COLOR} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text selectable style={[styles.codeText, { color: code.used ? colors.textGray : colors.foreground }]}>
                    {code.code}
                  </Text>
                  <Text style={[styles.codeType, { color: colors.textGray }]}>باقة {code.packageOrders} طلب</Text>
                  <Text style={[styles.codeDate, { color: colors.textLight }]}>
                    {timeAgo(code.createdAt)}{code.used && code.usedByPhone ? ` · للعميل ${code.usedByPhone}` : ""}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: code.used ? "#FFEBEE" : "#E8F5E9" }]}>
                  <Text style={{ color: code.used ? "#DC3545" : "#28A745", fontSize: 11, fontWeight: "700" }}>
                    {code.used ? "مستخدم" : "متاح"}
                  </Text>
                </View>
              </View>
              {!code.used && (
                <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleCopy(code.code)} activeOpacity={0.7}>
                    <Feather name="copy" size={15} color={AGENT_COLOR} />
                    <Text style={[styles.actionTxt, { color: AGENT_COLOR }]}>نسخ</Text>
                  </TouchableOpacity>
                  <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
                  <TouchableOpacity style={styles.actionBtn} onPress={() => setConfirmDelete(code)} activeOpacity={0.7}>
                    <Feather name="trash-2" size={15} color="#DC3545" />
                    <Text style={[styles.actionTxt, { color: "#DC3545" }]}>حذف</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Toast */}
      {toast && (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toast}>
            <Feather name="check-circle" size={16} color="#fff" />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      )}

      {/* Package picker */}
      <Modal transparent animationType="fade" visible={pickerOpen} onRequestClose={() => setPickerOpen(false)}>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.sheet, { backgroundColor: colors.card }]}>
            <View style={modalStyles.handle} />
            <Text style={[modalStyles.sheetTitle, { color: colors.foreground }]}>اختر نوع الباقة للكود</Text>
            <Text style={[modalStyles.sheetSub, { color: colors.textGray }]}>سيتم إنشاء كود تفعيل عشوائي للباقة</Text>
            <View style={{ marginTop: 12 }}>
              {AGENT_PACKAGES.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[modalStyles.pkgItem, { borderColor: colors.border }]}
                  onPress={() => handleGenerate(p.id)}
                  activeOpacity={0.7}
                >
                  <View style={[modalStyles.pkgIcon, { backgroundColor: AGENT_COLOR + "18" }]}>
                    <Text style={[modalStyles.pkgIconText, { color: AGENT_COLOR }]}>{p.orders}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[modalStyles.pkgName, { color: colors.foreground }]}>{p.label}</Text>
                    <Text style={[modalStyles.pkgSub, { color: colors.textGray }]}>{p.orders} طلب · {p.price} ₪</Text>
                  </View>
                  <Feather name="chevron-left" size={20} color={colors.textGray} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setPickerOpen(false)}>
              <Text style={[modalStyles.cancelTxt, { color: colors.textGray }]}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Generated modal */}
      <Modal transparent animationType="fade" visible={!!generated} onRequestClose={() => setGenerated(null)}>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.card, { backgroundColor: colors.card }]}>
            <View style={[modalStyles.iconWrap, { backgroundColor: AGENT_COLOR + "18" }]}>
              <Feather name="check-circle" size={36} color={AGENT_COLOR} />
            </View>
            <Text style={[modalStyles.title, { color: colors.foreground }]}>تم إنشاء الكود</Text>
            <Text style={[modalStyles.subtitle, { color: colors.textGray }]}>شارك هذا الكود مع عميلك لتفعيل الباقة</Text>

            <View style={[modalStyles.codeBox, { backgroundColor: AGENT_COLOR + "10", borderColor: AGENT_COLOR + "30" }]}>
              <Text selectable style={[modalStyles.codeText, { color: AGENT_COLOR }]}>{generated?.code}</Text>
              <Text style={[modalStyles.codeMeta, { color: colors.textGray }]}>باقة {generated?.packageOrders} طلب</Text>
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 16, width: "100%" }}>
              <TouchableOpacity
                style={[modalStyles.btnSecondary, { borderColor: AGENT_COLOR }]}
                onPress={() => generated && handleCopy(generated.code)}
                activeOpacity={0.8}
              >
                <Feather name="copy" size={16} color={AGENT_COLOR} />
                <Text style={[modalStyles.btnSecondaryTxt, { color: AGENT_COLOR }]}>نسخ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modalStyles.btn, { backgroundColor: AGENT_COLOR, flex: 1 }]} onPress={() => setGenerated(null)} activeOpacity={0.85}>
                <Text style={modalStyles.btnText}>تم</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete confirm */}
      <Modal transparent animationType="fade" visible={!!confirmDelete} onRequestClose={() => setConfirmDelete(null)}>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.card, { backgroundColor: colors.card }]}>
            <View style={[modalStyles.iconWrap, { backgroundColor: "#FFEBEE" }]}>
              <Feather name="alert-triangle" size={32} color="#DC3545" />
            </View>
            <Text style={[modalStyles.title, { color: colors.foreground }]}>حذف الكود؟</Text>
            <Text style={[modalStyles.subtitle, { color: colors.textGray }]}>
              سيتم حذف الكود {confirmDelete?.code} نهائياً.
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 18, width: "100%" }}>
              <TouchableOpacity style={[modalStyles.btnSecondary, { borderColor: colors.border, flex: 1 }]} onPress={() => setConfirmDelete(null)}>
                <Text style={[modalStyles.btnSecondaryTxt, { color: colors.foreground }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modalStyles.btn, { backgroundColor: "#DC3545", flex: 1 }]} onPress={handleDelete} activeOpacity={0.85}>
                <Text style={modalStyles.btnText}>حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: "row", marginTop: 14, backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 14, paddingVertical: 10 },
  statItem: { flex: 1, alignItems: "center" },
  statVal: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statLbl: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 2 },

  generateBtn: { marginHorizontal: 16, marginTop: 14, borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  generateText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: "700" },

  codeCard: { borderRadius: 14, borderWidth: 1 },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  codeIconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  codeText: { fontSize: 15, fontWeight: "800", fontVariant: ["tabular-nums"], letterSpacing: 0.5 },
  codeType: { fontSize: 12, marginTop: 2 },
  codeDate: { fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },

  actionsRow: { flexDirection: "row", borderTopWidth: 1 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
  actionTxt: { fontSize: 13, fontWeight: "700" },
  actionDivider: { width: 1 },

  emptyCard: { padding: 24, borderRadius: 16, borderWidth: 1, alignItems: "center", marginTop: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptyText: { fontSize: 12, textAlign: "center", marginTop: 4 },

  toastWrap: { position: "absolute", bottom: 100, left: 0, right: 0, alignItems: "center" },
  toast: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(0,0,0,0.85)", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  toastText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  sheet: { width: "100%", maxWidth: 420, borderRadius: 20, padding: 18 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#0001", alignSelf: "center", marginBottom: 10 },
  sheetTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  sheetSub: { fontSize: 12, textAlign: "center", marginTop: 4 },
  pkgItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  pkgIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  pkgIconText: { fontSize: 15, fontWeight: "800" },
  pkgName: { fontSize: 14, fontWeight: "700" },
  pkgSub: { fontSize: 12, marginTop: 2 },
  cancelBtn: { marginTop: 8, paddingVertical: 12, alignItems: "center" },
  cancelTxt: { fontSize: 14, fontWeight: "700" },

  card: { width: "100%", maxWidth: 380, borderRadius: 20, padding: 24, alignItems: "center" },
  iconWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 19, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 6, textAlign: "center" },
  codeBox: { width: "100%", marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: "center", gap: 4 },
  codeText: { fontSize: 20, fontWeight: "800", letterSpacing: 1.5, fontVariant: ["tabular-nums"] },
  codeMeta: { fontSize: 11, marginTop: 4 },
  btn: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  btnSecondary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1.5 },
  btnSecondaryTxt: { fontSize: 14, fontWeight: "700" },
});
