// app/(admin)/settings.tsx
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Platform,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";

const ADMIN_COLOR = "#1E88E5";
const ADMIN_DARK = "#0D47A1";

type SettingItem = 
  | { id: string; label: string; value: boolean; onValueChange: (value: boolean) => void; type: "switch"; description?: string }
  | { id: string; label: string; onPress: () => void; type: "button"; danger?: boolean; description?: string }
  | { id: string; label: string; value: string; onSave: (value: string) => void; type: "input"; description?: string };

export default function AdminSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { logout } = useAuth();
  const router = useRouter();

  // States
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [commissionRate, setCommissionRate] = useState("20");
  const [minWithdraw, setMinWithdraw] = useState("10");
  const [isEditingCommission, setIsEditingCommission] = useState(false);
  const [isEditingMinWithdraw, setIsEditingMinWithdraw] = useState(false);

  // ✅ تعريف handleLogout أولاً (قبل استخدامه)
  const handleLogout = () => {
    Alert.alert(
      "تسجيل الخروج",
      "هل أنت متأكد من تسجيل الخروج؟",
      [
        { text: "إلغاء", style: "cancel" },
        { 
          text: "تسجيل خروج", 
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/role-select");
          }
        }
      ]
    );
  };

  const handleSaveCommission = () => {
    setIsEditingCommission(false);
    Alert.alert("تم الحفظ", `تم تحديث نسبة العمولة إلى ${commissionRate}%`);
  };

  const handleSaveMinWithdraw = () => {
    setIsEditingMinWithdraw(false);
    Alert.alert("تم الحفظ", `تم تحديث الحد الأدنى للسحب إلى ${minWithdraw} شيكل`);
  };

  // إعدادات التطبيقات
  const appSettings: SettingItem[] = [
    { id: "notifications", label: "إشعارات النظام", value: notifications, onValueChange: setNotifications, type: "switch", description: "تلقي إشعارات حول تحديثات النظام" },
    { id: "email_notifications", label: "إشعارات البريد الإلكتروني", value: emailNotifications, onValueChange: setEmailNotifications, type: "switch", description: "استلام التقارير عبر البريد" },
    { id: "dark_mode", label: "الوضع الليلي", value: false, onValueChange: () => {}, type: "switch", description: "قيد التطوير قريباً" },
  ];

  // إعدادات العمليات
  const operationSettings: SettingItem[] = [
    { id: "auto_approve", label: "الموافقة التلقائية", value: autoApprove, onValueChange: setAutoApprove, type: "switch", description: "الموافقة على طلبات شحن الرصيد تلقائياً" },
    { id: "maintenance", label: "وضع الصيانة", value: maintenanceMode, onValueChange: setMaintenanceMode, type: "switch", description: "تعطيل خدمات التطبيق مؤقتاً" },
  ];

  // إعدادات العمولة
  const commissionSettings: SettingItem[] = [
    { id: "commission_rate", label: "نسبة العمولة", value: commissionRate, onSave: (val) => setCommissionRate(val), type: "input", description: "نسبة عمولة المنصة من كل عملية بيع" },
    { id: "min_withdraw", label: "الحد الأدنى للسحب", value: minWithdraw, onSave: (val) => setMinWithdraw(val), type: "input", description: "الحد الأدنى لطلب سحب العمولة" },
  ];

  // ✅ إجراءات النظام (بعد تعريف handleLogout)
  const systemActions: SettingItem[] = [
    { id: "export_data", label: "تصدير البيانات", onPress: () => Alert.alert("تصدير", "جاري تصدير البيانات..."), type: "button", description: "تصدير جميع بيانات النظام" },
    { id: "clear_cache", label: "مسح الكاش", onPress: () => Alert.alert("مسح الكاش", "تم مسح الكاش بنجاح"), type: "button", danger: true, description: "حذف الملفات المؤقتة" },
    { id: "reset_settings", label: "استعادة الإعدادات الافتراضية", onPress: () => Alert.alert("استعادة", "تم استعادة الإعدادات الافتراضية"), type: "button", danger: true, description: "إعادة تعيين جميع الإعدادات" },
    { id: "logout", label: "تسجيل الخروج", onPress: handleLogout, type: "button", danger: true, description: "الخروج من حساب الأدمن" },
  ];

  // دوال التحقق من النوع
  const isButton = (item: SettingItem): item is Extract<SettingItem, { type: "button" }> => item.type === "button";
  const isSwitch = (item: SettingItem): item is Extract<SettingItem, { type: "switch" }> => item.type === "switch";
  const isInput = (item: SettingItem): item is Extract<SettingItem, { type: "input" }> => item.type === "input";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: ADMIN_COLOR, paddingTop: topPad + 14 }]}>
        <Text style={styles.headerTitle}>إعدادات النظام</Text>
        <Text style={styles.headerSub}>تخصيص إعدادات المنصة</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* ==================== قسم الإعدادات العامة ==================== */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Feather name="settings" size={18} color={ADMIN_COLOR} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الإعدادات العامة</Text>
          </View>
          {appSettings.map((item, index) => (
            <View key={item.id} style={[styles.settingRow, index < appSettings.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
                {item.description && <Text style={[styles.settingDescription, { color: colors.textGray }]}>{item.description}</Text>}
              </View>
              {isSwitch(item) && (
                <Switch 
                  value={item.value} 
                  onValueChange={item.onValueChange} 
                  trackColor={{ false: colors.border, true: ADMIN_COLOR }}
                  thumbColor="#fff"
                />
              )}
            </View>
          ))}
        </View>

        {/* ==================== قسم إعدادات العمليات ==================== */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Feather name="briefcase" size={18} color={ADMIN_COLOR} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>إعدادات العمليات</Text>
          </View>
          {operationSettings.map((item, index) => (
            <View key={item.id} style={[styles.settingRow, index < operationSettings.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
                {item.description && <Text style={[styles.settingDescription, { color: colors.textGray }]}>{item.description}</Text>}
              </View>
              {isSwitch(item) && (
                <Switch 
                  value={item.value} 
                  onValueChange={item.onValueChange} 
                  trackColor={{ false: colors.border, true: ADMIN_COLOR }}
                  thumbColor="#fff"
                />
              )}
            </View>
          ))}
        </View>

        {/* ==================== قسم إعدادات العمولة ==================== */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Feather name="percent" size={18} color={ADMIN_COLOR} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>إعدادات العمولة</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>نسبة العمولة</Text>
              <Text style={[styles.settingDescription, { color: colors.textGray }]}>نسبة عمولة المنصة من كل عملية بيع</Text>
            </View>
            {isEditingCommission ? (
              <View style={styles.editRow}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={commissionRate}
                  onChangeText={setCommissionRate}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={[styles.inputUnit, { color: colors.textGray }]}>%</Text>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: ADMIN_COLOR }]} onPress={handleSaveCommission}>
                  <Feather name="check" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.valueRow} onPress={() => setIsEditingCommission(true)}>
                <Text style={[styles.settingValue, { color: ADMIN_COLOR, fontWeight: "700" }]}>{commissionRate}%</Text>
                <Feather name="edit-2" size={14} color={colors.textGray} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.settingRow, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>الحد الأدنى للسحب</Text>
              <Text style={[styles.settingDescription, { color: colors.textGray }]}>الحد الأدنى لطلب سحب العمولة</Text>
            </View>
            {isEditingMinWithdraw ? (
              <View style={styles.editRow}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={minWithdraw}
                  onChangeText={setMinWithdraw}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={[styles.inputUnit, { color: colors.textGray }]}>₪</Text>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: ADMIN_COLOR }]} onPress={handleSaveMinWithdraw}>
                  <Feather name="check" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.valueRow} onPress={() => setIsEditingMinWithdraw(true)}>
                <Text style={[styles.settingValue, { color: ADMIN_COLOR, fontWeight: "700" }]}>{minWithdraw} ₪</Text>
                <Feather name="edit-2" size={14} color={colors.textGray} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ==================== قسم إجراءات النظام ==================== */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Feather name="cpu" size={18} color={ADMIN_COLOR} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>إجراءات النظام</Text>
          </View>
          {systemActions.map((item, index) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.actionRow, index < systemActions.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
              onPress={isButton(item) ? item.onPress : undefined}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: (item as any).danger ? colors.destructive : colors.foreground }]}>{item.label}</Text>
                {item.description && <Text style={[styles.settingDescription, { color: colors.textGray }]}>{item.description}</Text>}
              </View>
              <Feather name="chevron-left" size={18} color={(item as any).danger ? colors.destructive : colors.textGray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ==================== معلومات الإصدار ==================== */}
        <View style={[styles.versionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={16} color={ADMIN_COLOR} />
          <View style={styles.versionInfo}>
            <Text style={[styles.versionText, { color: colors.foreground }]}>الإصدار 2.0.0</Text>
            <Text style={[styles.buildText, { color: colors.textLight }]}>بناء 2026.05.25</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== الأنماط ====================

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 4 },
  container: { padding: 16, gap: 16, paddingBottom: 40 },
  section: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: "#E5E5E5", backgroundColor: "#F8F9FA" },
  sectionIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: ADMIN_COLOR + "10", justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  settingInfo: { flex: 1, gap: 2 },
  settingLabel: { fontSize: 14, fontWeight: "600" },
  settingDescription: { fontSize: 11 },
  settingValue: { fontSize: 14 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { width: 60, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 14, textAlign: "center" },
  inputUnit: { fontSize: 13 },
  saveBtn: { width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  valueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  versionCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, justifyContent: "center" },
  versionInfo: { alignItems: "center" },
  versionText: { fontSize: 14, fontWeight: "600" },
  buildText: { fontSize: 11, marginTop: 2 },
});