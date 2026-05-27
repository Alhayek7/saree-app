// app/(support)/profile.tsx
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SupportProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser, logout } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "support@saree3.app");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("ar");

  const stats = [
    { label: "تذاكر مغلقة", value: "124", icon: "check-circle", color: "#28A745" },
    { label: "تذاكر مفتوحة", value: "8", icon: "alert-circle", color: "#DC3545" },
    { label: "معدل الرد", value: "2.5 ساعة", icon: "clock", color: "#FFA63D" },
    { label: "تقييم الخدمة", value: "4.8", icon: "star", color: "#FFC107" },
  ];

  const handleSave = async () => {
    if (!user) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateUser({
      ...user,
      fullName,
      phone,
    });
    setIsEditing(false);
    Alert.alert("✅ تم الحفظ", "تم تحديث بياناتك الشخصية بنجاح");
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
    router.replace("/role-select");
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setShowLanguageModal(false);
    Alert.alert("✅ تم التغيير", `تم تغيير اللغة إلى ${lang === "ar" ? "العربية" : "English"}`);
  };

  const menuItems = [
    { icon: "ticket", label: "جميع التذاكر", route: "/(support)/tickets", color: "#00ACC1" },
    { icon: "bell", label: "الإشعارات", route: "/notifications", color: "#17A2B8" },
    { icon: "help-circle", label: "الدعم الفني", route: "/faq", color: "#FF6584" },
    { icon: "info", label: "عن التطبيق", route: "/about", color: colors.textGray },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: "#00ACC1", paddingTop: topPad + 16 }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="arrow-right" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>حسابي</Text>
            {!isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
                <Feather name="edit-2" size={18} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>
        </View>

        {/* Profile Info Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: "#00ACC120" }]}>
              <Text style={[styles.avatarText, { color: "#00ACC1" }]}>
                {user?.fullName?.charAt(0) || "د"}
              </Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: "#00ACC115" }]}>
              <Feather name="headphones" size={12} color="#00ACC1" />
              <Text style={[styles.roleText, { color: "#00ACC1" }]}>فريق الدعم الفني</Text>
            </View>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textGray }]}>الاسم الكامل</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="الاسم الكامل"
                  placeholderTextColor={colors.textLight}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textGray }]}>رقم الهاتف</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="رقم الهاتف"
                  placeholderTextColor={colors.textLight}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textGray }]}>البريد الإلكتروني</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="البريد الإلكتروني"
                  placeholderTextColor={colors.textLight}
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  onPress={() => {
                    setIsEditing(false);
                    setFullName(user?.fullName || "");
                    setPhone(user?.phone || "");
                    setEmail("support@saree3.app");
                  }}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textGray }]}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: "#00ACC1" }]} onPress={handleSave}>
                  <Feather name="check" size={16} color="#fff" />
                  <Text style={styles.saveBtnText}>حفظ التغييرات</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: colors.foreground }]}>{user?.fullName}</Text>
              <View style={styles.infoRow}>
                <Feather name="phone" size={14} color={colors.textGray} />
                <Text style={[styles.infoText, { color: colors.textGray }]}>{user?.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Feather name="mail" size={14} color={colors.textGray} />
                <Text style={[styles.infoText, { color: colors.textGray }]}>{email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Feather name="headphones" size={14} color={colors.textGray} />
                <Text style={[styles.infoText, { color: colors.textGray }]}>فريق الدعم الفني</Text>
              </View>
            </View>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + "15" }]}>
                <Feather name={stat.icon as any} size={18} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textGray }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuTitle, { color: colors.foreground }]}>القائمة</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Language Selector */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              onPress={() => setShowLanguageModal(true)}
            >
              <View style={[styles.menuIcon, { backgroundColor: "#6C63FF15" }]}>
                <Feather name="globe" size={18} color="#6C63FF" />
              </View>
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>اللغة</Text>
              <Text style={[styles.menuValue, { color: colors.textGray }]}>
                {selectedLanguage === "ar" ? "العربية" : "English"}
              </Text>
              <Feather name="chevron-left" size={16} color={colors.textLight} />
            </TouchableOpacity>

            {menuItems.map((item, index, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  index < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + "15" }]}>
                  <Feather name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Feather name="chevron-left" size={16} color={colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          {showLogoutConfirm ? (
            <View style={[styles.logoutConfirmBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.logoutConfirmText, { color: colors.foreground }]}>هل أنت متأكد من تسجيل الخروج؟</Text>
              <View style={styles.logoutConfirmRow}>
                <TouchableOpacity
                  style={[styles.logoutConfirmYes, { backgroundColor: "#DC3545" }]}
                  onPress={handleLogout}
                >
                  <Feather name="log-out" size={16} color="#fff" />
                  <Text style={styles.logoutConfirmYesText}>نعم، خروج</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.logoutConfirmNo, { backgroundColor: colors.muted }]}
                  onPress={() => setShowLogoutConfirm(false)}
                >
                  <Text style={[styles.logoutConfirmNoText, { color: colors.textGray }]}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.logoutBtn, { backgroundColor: "#DC3545" }]}
              onPress={() => setShowLogoutConfirm(true)}
            >
              <Feather name="log-out" size={20} color="#fff" />
              <Text style={styles.logoutBtnText}>تسجيل الخروج</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* App Version */}
        <Text style={[styles.versionText, { color: colors.textLight }]}>الإصدار 2.0.0</Text>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal visible={showLanguageModal} transparent animationType="fade" onRequestClose={() => setShowLanguageModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLanguageModal(false)}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>اختر اللغة</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Feather name="x" size={22} color={colors.textGray} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.languageOption, selectedLanguage === "ar" && { backgroundColor: colors.primary + "10" }]}
              onPress={() => handleLanguageChange("ar")}
            >
              <Text style={[styles.languageText, { color: colors.foreground }]}>العربية</Text>
              {selectedLanguage === "ar" && <Feather name="check" size={18} color={colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageOption, selectedLanguage === "en" && { backgroundColor: colors.primary + "10" }]}
              onPress={() => handleLanguageChange("en")}
            >
              <Text style={[styles.languageText, { color: colors.foreground }]}>English</Text>
              {selectedLanguage === "en" && <Feather name="check" size={18} color={colors.primary} />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  
  // Header
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  editBtn: { padding: 8 },
  
  // Profile Card
  profileCard: { marginHorizontal: 16, marginTop: -20, borderRadius: 20, borderWidth: 1, padding: 16, alignItems: "center" },
  avatarContainer: { alignItems: "center", marginBottom: 12, position: "relative" },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 32, fontWeight: "800" },
  roleBadge: { position: "absolute", bottom: -12, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 10, fontWeight: "600" },
  
  // Profile Info
  profileInfo: { alignItems: "center", gap: 8, width: "100%" },
  userName: { fontSize: 18, fontWeight: "700" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 13 },
  
  // Edit Form
  editForm: { width: "100%", gap: 12, marginTop: 8 },
  inputGroup: { gap: 4 },
  inputLabel: { fontSize: 12, fontWeight: "600" },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  editActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontWeight: "600" },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 10 },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  
  // Stats Grid
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, padding: 16 },
  statCard: { width: "47%", alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1, gap: 6 },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11, textAlign: "center" },
  
  // Menu Section
  menuSection: { paddingHorizontal: 16, marginBottom: 20 },
  menuTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  menuCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
  menuValue: { fontSize: 13, marginRight: 8 },
  
  // Logout Section
  logoutSection: { paddingHorizontal: 16, marginBottom: 20 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  logoutBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  logoutConfirmBox: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 12, alignItems: "center" },
  logoutConfirmText: { fontSize: 14, fontWeight: "600" },
  logoutConfirmRow: { flexDirection: "row", gap: 10, width: "100%" },
  logoutConfirmYes: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  logoutConfirmYesText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  logoutConfirmNo: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10 },
  logoutConfirmNoText: { fontSize: 14, fontWeight: "600" },
  
  // Version
  versionText: { textAlign: "center", fontSize: 11, marginBottom: 20 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  modalContainer: { width: "100%", borderRadius: 20, padding: 20, gap: 12 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  languageOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10 },
  languageText: { fontSize: 15 },
});