import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ─── Notification Settings State ─── */
type NotifSettings = {
  orderUpdates: boolean;
  driverArrival: boolean;
  promotions: boolean;
  systemAlerts: boolean;
};

/* ─── Bottom Sheet Modal wrapper ─── */
function BottomSheet({
  visible,
  onClose,
  title,
  children,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={[styles.sheetClose, { backgroundColor: colors.muted }]}>
            <Feather name="x" size={16} color={colors.textGray} />
          </TouchableOpacity>
        </View>
        {children}
      </View>
    </Modal>
  );
}

/* ─── Notifications Sheet ─── */
function NotificationsSheet({ visible, onClose, colors }: { visible: boolean; onClose: () => void; colors: any }) {
  const [settings, setSettings] = useState<NotifSettings>({
    orderUpdates: true,
    driverArrival: true,
    promotions: false,
    systemAlerts: true,
  });

  const toggle = (key: keyof NotifSettings) => {
    Haptics.selectionAsync();
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  };

  const items: { key: keyof NotifSettings; label: string; sub: string; icon: string; color: string }[] = [
    { key: "orderUpdates", label: "تحديثات الطلب", sub: "استلام حالة طلبك خطوة بخطوة", icon: "package", color: "#6C63FF" },
    { key: "driverArrival", label: "وصول السائق", sub: "تنبيه عند اقتراب السائق منك", icon: "map-pin", color: "#28A745" },
    { key: "promotions", label: "العروض والتخفيضات", sub: "أخبار حصرية وعروض مميزة", icon: "tag", color: "#FFC107" },
    { key: "systemAlerts", label: "تنبيهات النظام", sub: "صيانة وتحديثات التطبيق", icon: "bell", color: "#17A2B8" },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} title="الإشعارات" colors={colors}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }} showsVerticalScrollIndicator={false}>
        {items.map((item, idx) => (
          <View
            key={item.key}
            style={[styles.notifRow, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <View style={[styles.notifIcon, { backgroundColor: item.color + "18" }]}>
              <Feather name={item.icon as any} size={18} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.notifLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Text style={[styles.notifSub, { color: colors.textGray }]}>{item.sub}</Text>
            </View>
            <Switch
              value={settings[item.key]}
              onValueChange={() => toggle(item.key)}
              trackColor={{ false: colors.border, true: item.color + "60" }}
              thumbColor={settings[item.key] ? item.color : colors.textLight}
            />
          </View>
        ))}
        <TouchableOpacity
          style={[styles.sheetBtn, { backgroundColor: "#6C63FF" }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert("تم الحفظ ✅", "تم تحديث إعدادات الإشعارات"); onClose(); }}
          activeOpacity={0.85}
        >
          <Text style={styles.sheetBtnText}>حفظ الإعدادات</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
}

/* ─── Privacy & Security Sheet ─── */
function PrivacySheet({ visible, onClose, colors }: { visible: boolean; onClose: () => void; colors: any }) {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [twoFA, setTwoFA] = useState(false);

  const handleChangePwd = () => {
    if (!currentPwd || !newPwd) { Alert.alert("خطأ", "يرجى ملء جميع الحقول"); return; }
    if (newPwd.length < 6) { Alert.alert("خطأ", "كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("تم التغيير ✅", "تم تغيير كلمة المرور بنجاح");
    setCurrentPwd(""); setNewPwd("");
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="الخصوصية والأمان" colors={colors}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
        {/* Change password */}
        <View style={[styles.privacySection, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.privacySectionHeader}>
            <View style={[styles.notifIcon, { backgroundColor: "#6C63FF18" }]}>
              <Feather name="lock" size={16} color="#6C63FF" />
            </View>
            <Text style={[styles.privacySectionTitle, { color: colors.foreground }]}>تغيير كلمة المرور</Text>
          </View>
          <View style={[styles.pwdInputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.pwdInput, { color: colors.foreground }]}
              placeholder="كلمة المرور الحالية"
              placeholderTextColor={colors.textLight}
              secureTextEntry={!showPwd}
              value={currentPwd}
              onChangeText={setCurrentPwd}
            />
            <TouchableOpacity onPress={() => setShowPwd((v) => !v)}>
              <Feather name={showPwd ? "eye-off" : "eye"} size={16} color={colors.textLight} />
            </TouchableOpacity>
          </View>
          <View style={[styles.pwdInputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.pwdInput, { color: colors.foreground }]}
              placeholder="كلمة المرور الجديدة"
              placeholderTextColor={colors.textLight}
              secureTextEntry={!showPwd}
              value={newPwd}
              onChangeText={setNewPwd}
            />
          </View>
          <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: "#6C63FF" }]} onPress={handleChangePwd} activeOpacity={0.85}>
            <Text style={styles.sheetBtnText}>تغيير كلمة المرور</Text>
          </TouchableOpacity>
        </View>

        {/* 2FA */}
        <View style={[styles.privacySection, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={[styles.notifRow, { backgroundColor: "transparent", borderWidth: 0, paddingHorizontal: 0 }]}>
            <View style={[styles.notifIcon, { backgroundColor: "#28A74518" }]}>
              <Feather name="shield" size={16} color="#28A745" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.notifLabel, { color: colors.foreground }]}>التحقق الثنائي</Text>
              <Text style={[styles.notifSub, { color: colors.textGray }]}>حماية إضافية عبر رقم هاتفك</Text>
            </View>
            <Switch
              value={twoFA}
              onValueChange={(v) => { Haptics.selectionAsync(); setTwoFA(v); if (v) Alert.alert("تم التفعيل ✅", "سيُرسَل رمز التحقق عند كل تسجيل دخول"); }}
              trackColor={{ false: colors.border, true: "#28A74560" }}
              thumbColor={twoFA ? "#28A745" : colors.textLight}
            />
          </View>
        </View>

        {/* Data */}
        <View style={[styles.privacySection, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.privacySectionHeader}>
            <View style={[styles.notifIcon, { backgroundColor: "#17A2B818" }]}>
              <Feather name="database" size={16} color="#17A2B8" />
            </View>
            <Text style={[styles.privacySectionTitle, { color: colors.foreground }]}>بيانات الحساب</Text>
          </View>
          <TouchableOpacity
            style={[styles.dataBtn, { borderColor: colors.border }]}
            onPress={() => { Haptics.selectionAsync(); Alert.alert("تصدير البيانات", "سيتم إرسال نسخة من بياناتك إلى بريدك الإلكتروني خلال 24 ساعة"); }}
          >
            <Feather name="download" size={14} color={colors.textGray} />
            <Text style={[styles.dataBtnText, { color: colors.textGray }]}>تصدير بياناتي</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dataBtn, { borderColor: "#FF6B6B40" }]}
            onPress={() => Alert.alert("حذف الحساب", "هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟", [
              { text: "إلغاء", style: "cancel" },
              { text: "حذف", style: "destructive", onPress: () => Alert.alert("تم الإرسال", "سيتم مراجعة طلبك خلال 3 أيام عمل") },
            ])}
          >
            <Feather name="trash-2" size={14} color="#FF6B6B" />
            <Text style={[styles.dataBtnText, { color: "#FF6B6B" }]}>طلب حذف الحساب</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

/* ─── Support Sheet ─── */
function SupportSheet({ visible, onClose, colors }: { visible: boolean; onClose: () => void; colors: any }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const sendSupport = () => {
    if (!message.trim()) { Alert.alert("تنبيه", "يرجى كتابة رسالتك أولاً"); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSent(true);
    setTimeout(() => { setSent(false); setMessage(""); }, 3000);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="الدعم الفني" colors={colors}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        {/* Contact options */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: "#25D36615", borderColor: "#25D36630", flex: 1 }]}
            onPress={() => { Haptics.selectionAsync(); Linking.openURL("https://wa.me/97059900000?text=مرحباً، أحتاج مساعدة في تطبيق سريع"); }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 24 }}>💬</Text>
            <Text style={[styles.contactLabel, { color: "#25D366" }]}>واتساب</Text>
            <Text style={[styles.contactSub, { color: colors.textGray }]}>رد خلال دقائق</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: "#6C63FF15", borderColor: "#6C63FF30", flex: 1 }]}
            onPress={() => { Haptics.selectionAsync(); Linking.openURL("mailto:support@saree.ps?subject=طلب دعم فني"); }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 24 }}>📧</Text>
            <Text style={[styles.contactLabel, { color: "#6C63FF" }]}>البريد</Text>
            <Text style={[styles.contactSub, { color: colors.textGray }]}>رد خلال 24 ساعة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: "#17A2B815", borderColor: "#17A2B830", flex: 1 }]}
            onPress={() => { Haptics.selectionAsync(); Linking.openURL("tel:+97059900000"); }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 24 }}>📞</Text>
            <Text style={[styles.contactLabel, { color: "#17A2B8" }]}>اتصال</Text>
            <Text style={[styles.contactSub, { color: colors.textGray }]}>9ص – 9م</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <Text style={[styles.privacySectionTitle, { color: colors.foreground, marginTop: 4 }]}>أسئلة شائعة</Text>
        {[
          { q: "كيف أتتبع طلبي؟", a: "بعد قبول السائق لطلبك ستظهر لك شاشة التتبع تلقائياً" },
          { q: "كيف يتم الدفع؟", a: "الدفع عند الاستلام نقداً أو عبر المحفظة الإلكترونية" },
          { q: "كيف ألغي طلباً؟", a: "يمكنك الإلغاء من شاشة تتبع الطلب قبل أن يتحرك السائق" },
        ].map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.faqItem, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => { Haptics.selectionAsync(); Alert.alert(faq.q, faq.a); }}
            activeOpacity={0.8}
          >
            <Feather name="help-circle" size={16} color="#17A2B8" />
            <Text style={[{ flex: 1, fontSize: 14, color: colors.foreground }]}>{faq.q}</Text>
            <Feather name="chevron-left" size={14} color={colors.textLight} />
          </TouchableOpacity>
        ))}

        {/* Send message */}
        <Text style={[styles.privacySectionTitle, { color: colors.foreground, marginTop: 4 }]}>أرسل رسالة</Text>
        <View style={[styles.msgInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TextInput
            style={[{ color: colors.foreground, fontSize: 14, minHeight: 90, textAlignVertical: "top" }]}
            placeholder="صف مشكلتك بالتفصيل..."
            placeholderTextColor={colors.textLight}
            multiline
            value={message}
            onChangeText={setMessage}
          />
        </View>
        {sent ? (
          <View style={[styles.sheetBtn, { backgroundColor: "#28A745", flexDirection: "row", gap: 8, justifyContent: "center", alignItems: "center" }]}>
            <Feather name="check-circle" size={18} color="#fff" />
            <Text style={styles.sheetBtnText}>تم إرسال رسالتك ✅</Text>
          </View>
        ) : (
          <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: "#17A2B8" }]} onPress={sendSupport} activeOpacity={0.85}>
            <Text style={styles.sheetBtnText}>إرسال الرسالة</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

/* ─── About Sheet ─── */
function AboutSheet({ visible, onClose, colors }: { visible: boolean; onClose: () => void; colors: any }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="عن التطبيق" colors={colors}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, alignItems: "center" }} showsVerticalScrollIndicator={false}>
        <View style={[styles.appIconWrap, { backgroundColor: "#6C63FF18" }]}>
          <Text style={{ fontSize: 48 }}>⚡</Text>
        </View>
        <Text style={[styles.appName, { color: colors.foreground }]}>سريع</Text>
        <Text style={[styles.appTagline, { color: colors.textGray }]}>منصة التوصيل السريع في غزة</Text>
        <View style={[styles.versionBadge, { backgroundColor: colors.muted }]}>
          <Text style={[styles.versionText, { color: colors.textGray }]}>الإصدار 1.0.0</Text>
        </View>

        <View style={[styles.aboutCard, { backgroundColor: colors.background, borderColor: colors.border, alignSelf: "stretch" }]}>
          {[
            { icon: "map-pin", label: "غزة، فلسطين", color: "#28A745" },
            { icon: "mail", label: "info@saree.ps", color: "#6C63FF", action: () => Linking.openURL("mailto:info@saree.ps") },
            { icon: "globe", label: "www.saree.ps", color: "#17A2B8", action: () => Linking.openURL("https://saree.ps") },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={i}
              style={[styles.aboutRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              onPress={() => { if (item.action) { Haptics.selectionAsync(); item.action(); } }}
              activeOpacity={item.action ? 0.7 : 1}
            >
              <View style={[styles.notifIcon, { backgroundColor: item.color + "18" }]}>
                <Feather name={item.icon as any} size={15} color={item.color} />
              </View>
              <Text style={[{ flex: 1, fontSize: 14, color: item.action ? item.color : colors.foreground }]}>{item.label}</Text>
              {item.action && <Feather name="external-link" size={13} color={colors.textLight} />}
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.aboutCard, { backgroundColor: colors.background, borderColor: colors.border, alignSelf: "stretch" }]}>
          <TouchableOpacity
            style={[styles.aboutRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={() => { Haptics.selectionAsync(); Alert.alert("سياسة الخصوصية", "نحن في سريع نلتزم بحماية بياناتك الشخصية ونستخدمها فقط لتحسين تجربتك."); }}
            activeOpacity={0.7}
          >
            <View style={[styles.notifIcon, { backgroundColor: "#FF6B6B18" }]}>
              <Feather name="file-text" size={15} color="#FF6B6B" />
            </View>
            <Text style={[{ flex: 1, fontSize: 14, color: colors.foreground }]}>سياسة الخصوصية</Text>
            <Feather name="chevron-left" size={14} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.aboutRow}
            onPress={() => { Haptics.selectionAsync(); Alert.alert("شروط الاستخدام", "باستخدامك لتطبيق سريع فأنت توافق على شروط الخدمة المعمول بها."); }}
            activeOpacity={0.7}
          >
            <View style={[styles.notifIcon, { backgroundColor: "#FFC10718" }]}>
              <Feather name="book-open" size={15} color="#FFC107" />
            </View>
            <Text style={[{ flex: 1, fontSize: 14, color: colors.foreground }]}>شروط الاستخدام</Text>
            <Feather name="chevron-left" size={14} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.copyright, { color: colors.textLight }]}>© 2024 سريع. جميع الحقوق محفوظة</Text>
        <View style={{ height: 8 }} />
      </ScrollView>
    </BottomSheet>
  );
}

/* ════════════════════════════════════
   Main Profile Screen
════════════════════════════════════ */
export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser, logout, removeSavedAddress } = useAuth();
  const { getMyOrders } = useOrders();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.fullName ?? "");
  const [hood, setHood] = useState(user?.neighborhood ?? "");
  const [saving, setSaving] = useState(false);

  const [showNotifs, setShowNotifs] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const orders = user ? getMyOrders(user.id) : [];
  const completed = orders.filter((o) => o.status === "completed").length;
  const avgRating = orders.filter((o) => o.rating).reduce((s, o) => s + (o.rating ?? 0), 0) / (orders.filter((o) => o.rating).length || 1);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const saveProfile = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    await updateUser({ ...user, fullName: name.trim(), neighborhood: hood.trim() });
    setSaving(false);
    setEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleLogoutConfirm = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
    router.replace("/role-select" as any);
  };

  const menuItems = [
    { icon: "bell" as const,        label: "الإشعارات",          color: "#6C63FF", onPress: () => { Haptics.selectionAsync(); setShowNotifs(true); } },
    { icon: "shield" as const,      label: "الخصوصية والأمان",   color: "#28A745", onPress: () => { Haptics.selectionAsync(); setShowPrivacy(true); } },
    { icon: "help-circle" as const, label: "الدعم الفني",        color: "#17A2B8", onPress: () => { Haptics.selectionAsync(); setShowSupport(true); } },
{ icon: "info" as const, label: "عن التطبيق", color: colors.textGray, onPress: () => { Haptics.selectionAsync(); router.push("/about"); } },  ];

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPad + 20 }]}>
          <View style={styles.headerRow}>
            <View style={[styles.avatar, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
              <Text style={styles.avatarText}>{user?.fullName?.charAt(0) ?? "م"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              {editing ? (
                <TextInput
                  style={[styles.nameInput, { borderBottomColor: "rgba(255,255,255,0.5)" }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="الاسم الكامل"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
              ) : (
                <Text style={styles.userName}>{user?.fullName}</Text>
              )}
              {editing ? (
                <TextInput
                  style={[styles.hoodInput, { borderBottomColor: "rgba(255,255,255,0.3)" }]}
                  value={hood}
                  onChangeText={setHood}
                  placeholder="الحي أو المنطقة"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
              ) : (
                <Text style={styles.userPhone}>{user?.phone}  {user?.neighborhood ? `• ${user.neighborhood}` : ""}</Text>
              )}
            </View>
            {editing ? (
              <View style={{ gap: 6 }}>
                <TouchableOpacity style={[styles.editBtn, { backgroundColor: "rgba(255,255,255,0.9)" }]} onPress={saveProfile} disabled={saving}>
                  <Feather name="check" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.editBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]} onPress={() => { setEditing(false); setName(user?.fullName ?? ""); setHood(user?.neighborhood ?? ""); }}>
                  <Feather name="x" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[styles.editBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]} onPress={() => setEditing(true)}>
                <Feather name="edit-2" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "إجمالي الطلبات", value: String(orders.length), icon: "package", color: colors.primary },
            { label: "مكتملة", value: String(completed), icon: "check-circle", color: "#28A745" },
            { label: "متوسط التقييم", value: orders.filter((o) => o.rating).length ? avgRating.toFixed(1) : "—", icon: "star", color: "#FFC107" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={s.icon as any} size={18} color={s.color} />
              <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textGray }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Saved Addresses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>العناوين المحفوظة</Text>
          </View>
          <View style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(user?.savedAddresses ?? []).length === 0 ? (
              <Text style={[styles.emptyAddr, { color: colors.textGray }]}>لا توجد عناوين محفوظة بعد</Text>
            ) : (
              (user?.savedAddresses ?? []).map((addr, idx) => (
                <View key={addr.id}>
                  {idx > 0 && <View style={[styles.addrDivider, { backgroundColor: colors.border }]} />}
                  <View style={styles.addrRow}>
                    <View style={[styles.addrIcon, { backgroundColor: colors.primaryContainer }]}>
                      <Feather name={addr.icon} size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.addrLabel, { color: colors.foreground }]}>{addr.label}</Text>
                      <Text style={[styles.addrText, { color: colors.textGray }]}>{addr.address}</Text>
                    </View>
                    <TouchableOpacity onPress={() => Alert.alert("حذف", `حذف "${addr.label}"؟`, [
                      { text: "إلغاء", style: "cancel" },
                      { text: "حذف", style: "destructive", onPress: () => removeSavedAddress(addr.id) },
                    ])}>
                      <Feather name="trash-2" size={16} color={colors.textLight} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Settings Menu */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الإعدادات</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {menuItems.map((item, idx, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + "18" }]}>
                  <Feather name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Feather name="chevron-left" size={16} color={colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <View style={[styles.section, { marginTop: 8, marginBottom: 24 }]}>
          <View style={[styles.logoutDivider, { backgroundColor: colors.border }]} />

          {confirmLogout ? (
            <View style={styles.logoutConfirmBox}>
              <Text style={[styles.logoutConfirmText, { color: colors.foreground }]}>
                هل أنت متأكد من الخروج؟
              </Text>
              <View style={styles.logoutConfirmRow}>
                <TouchableOpacity
                  style={[styles.logoutConfirmBtn, { backgroundColor: "#EF5350" }]}
                  onPress={handleLogoutConfirm}
                  activeOpacity={0.85}
                >
                  <Feather name="log-out" size={16} color="#fff" />
                  <Text style={styles.logoutConfirmBtnText}>نعم، خروج</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.logoutCancelBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  onPress={() => setConfirmLogout(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.logoutCancelText, { color: colors.foreground }]}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => { Haptics.selectionAsync(); setConfirmLogout(true); }}
              activeOpacity={0.85}
            >
              <View style={styles.logoutIconWrap}>
                <Feather name="log-out" size={20} color="#fff" />
              </View>
              <Text style={styles.logoutText}>تسجيل الخروج</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <NotificationsSheet visible={showNotifs} onClose={() => setShowNotifs(false)} colors={colors} />
      <PrivacySheet visible={showPrivacy} onClose={() => setShowPrivacy(false)} colors={colors} />
      <SupportSheet visible={showSupport} onClose={() => setShowSupport(false)} colors={colors} />
      <AboutSheet visible={showAbout} onClose={() => setShowAbout(false)} colors={colors} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 26, fontWeight: "800" },
  userName: { color: "#fff", fontSize: 20, fontWeight: "700" },
  userPhone: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 3 },
  nameInput: { color: "#fff", fontSize: 18, fontWeight: "700", borderBottomWidth: 1, paddingBottom: 4 },
  hoodInput: { color: "rgba(255,255,255,0.8)", fontSize: 13, borderBottomWidth: 1, paddingBottom: 2, marginTop: 6 },
  editBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  statsRow: { flexDirection: "row", gap: 10, padding: 16 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center", gap: 5 },
  statVal: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, textAlign: "center" },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  addressCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  addrRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  addrIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  addrLabel: { fontSize: 14, fontWeight: "600" },
  addrText: { fontSize: 12, marginTop: 2 },
  addrDivider: { height: 1 },
  emptyAddr: { padding: 16, textAlign: "center", fontSize: 13 },
  menuCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  logoutDivider: { height: 1, marginBottom: 20 },
  logoutBtn: { borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: "#EF5350", shadowColor: "#EF5350", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  logoutIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  logoutText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  logoutConfirmBox: { borderRadius: 16, gap: 14 },
  logoutConfirmText: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  logoutConfirmRow: { flexDirection: "row", gap: 10 },
  logoutConfirmBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  logoutConfirmBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  logoutCancelBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  logoutCancelText: { fontSize: 15, fontWeight: "700" },
  /* Sheet */
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "88%", overflow: "hidden" },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4 },
  sheetHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  sheetTitle: { flex: 1, fontSize: 17, fontWeight: "700" },
  sheetClose: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  sheetBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  sheetBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  /* Notif */
  notifRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, gap: 12 },
  notifIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  notifLabel: { fontSize: 14, fontWeight: "600" },
  notifSub: { fontSize: 11, marginTop: 2 },
  /* Privacy */
  privacySection: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  privacySectionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  privacySectionTitle: { fontSize: 15, fontWeight: "700" },
  pwdInputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  pwdInput: { flex: 1, fontSize: 14 },
  dataBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  dataBtnText: { fontSize: 14 },
  /* Support */
  contactCard: { alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  contactLabel: { fontSize: 13, fontWeight: "700" },
  contactSub: { fontSize: 10 },
  faqItem: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  msgInput: { borderRadius: 12, borderWidth: 1.5, padding: 12 },
  /* About */
  appIconWrap: { width: 90, height: 90, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  appName: { fontSize: 26, fontWeight: "800" },
  appTagline: { fontSize: 14 },
  versionBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  versionText: { fontSize: 12 },
  aboutCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  aboutRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  copyright: { fontSize: 11, marginTop: 4 },
});
