// app/(store-owner)/profile.tsx
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

export default function StoreProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser, logout } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || "");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateUser({
      ...user,
      fullName,
      phone,
      neighborhood,
    });
    setIsEditing(false);
    Alert.alert("✅ تم الحفظ", "تم تحديث بيانات المتجر بنجاح");
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
    router.replace("/role-select");
  };

  const menuItems = [
    { icon: "shopping-bag", label: "منتجاتي", route: "/(store-owner)/products", color: "#FF6584" },
    { icon: "list", label: "الطلبات", route: "/(store-owner)/orders", color: "#6C63FF" },
    { icon: "bell", label: "الإشعارات", route: "/notifications", color: "#17A2B8" },
    { icon: "help-circle", label: "الدعم الفني", route: "/faq", color: "#FF9800" },
    { icon: "info", label: "عن التطبيق", route: "/about", color: colors.textGray },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: "#FF6584", paddingTop: topPad + 16 }]}>
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

        {/* Profile Info */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: "#FF658420" }]}>
              <Text style={[styles.avatarText, { color: "#FF6584" }]}>
                {user?.fullName?.charAt(0) || "م"}
              </Text>
            </View>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textGray }]}>اسم المتجر</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="اسم المتجر"
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
                <Text style={[styles.inputLabel, { color: colors.textGray }]}>المنطقة</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={neighborhood}
                  onChangeText={setNeighborhood}
                  placeholder="مثال: الرمال"
                  placeholderTextColor={colors.textLight}
                />
              </View>
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  onPress={() => {
                    setIsEditing(false);
                    setFullName(user?.fullName || "");
                    setPhone(user?.phone || "");
                    setNeighborhood(user?.neighborhood || "");
                  }}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textGray }]}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: "#FF6584" }]} onPress={handleSave}>
                  <Feather name="check" size={16} color="#fff" />
                  <Text style={styles.saveBtnText}>حفظ</Text>
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
              {user?.neighborhood && (
                <View style={styles.infoRow}>
                  <Feather name="map-pin" size={14} color={colors.textGray} />
                  <Text style={[styles.infoText, { color: colors.textGray }]}>{user?.neighborhood}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="shopping-bag" size={20} color="#FF6584" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{user?.totalOrders || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>إجمالي الطلبات</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="credit-card" size={20} color="#28A745" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{user?.totalRevenue || 0} ₪</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>الإيرادات</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuTitle, { color: colors.foreground }]}>القائمة</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {menuItems.map((item, index, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, index < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
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

        {/* Logout */}
        <View style={styles.logoutSection}>
          {showLogoutConfirm ? (
            <View style={[styles.logoutConfirmBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.logoutConfirmText, { color: colors.foreground }]}>هل أنت متأكد من تسجيل الخروج؟</Text>
              <View style={styles.logoutConfirmRow}>
                <TouchableOpacity style={[styles.logoutConfirmYes, { backgroundColor: "#DC3545" }]} onPress={handleLogout}>
                  <Feather name="log-out" size={16} color="#fff" />
                  <Text style={styles.logoutConfirmYesText}>نعم، خروج</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.logoutConfirmNo, { backgroundColor: colors.muted }]} onPress={() => setShowLogoutConfirm(false)}>
                  <Text style={[styles.logoutConfirmNoText, { color: colors.textGray }]}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: "#DC3545" }]} onPress={() => setShowLogoutConfirm(true)}>
              <Feather name="log-out" size={20} color="#fff" />
              <Text style={styles.logoutBtnText}>تسجيل الخروج</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.versionText, { color: colors.textLight }]}>الإصدار 2.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  editBtn: { padding: 8 },
  profileCard: { marginHorizontal: 16, marginTop: -20, borderRadius: 20, borderWidth: 1, padding: 16, alignItems: "center" },
  avatarContainer: { alignItems: "center", marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 32, fontWeight: "800" },
  profileInfo: { alignItems: "center", gap: 8, width: "100%" },
  userName: { fontSize: 18, fontWeight: "700" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 13 },
  editForm: { width: "100%", gap: 12, marginTop: 8 },
  inputGroup: { gap: 4 },
  inputLabel: { fontSize: 12, fontWeight: "600" },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  editActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontWeight: "600" },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 10 },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  statsGrid: { flexDirection: "row", gap: 12, padding: 16 },
  statCard: { flex: 1, alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1, gap: 6 },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11, textAlign: "center" },
  menuSection: { paddingHorizontal: 16, marginBottom: 20 },
  menuTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  menuCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
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
  versionText: { textAlign: "center", fontSize: 11, marginBottom: 20 },
});