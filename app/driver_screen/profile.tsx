


// app/(driver)/profile.tsx
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
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

const VEHICLE_OPTIONS = [
  { type: "car", label: "🚗 سيارة", description: "للطرود المتوسطة" },
  { type: "bike", label: "🚲 باسكليت", description: "للطرود الصغيرة والسريعة" },
  { type: "truck", label: "🚛 سيارة نقل", description: "للأغراض الكبيرة والثقيلة" },
];

export default function DriverProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser, logout } = useAuth();
  const { getMyOrders } = useOrders();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || "");
  const [selectedVehicle, setSelectedVehicle] = useState(user?.vehicleType || "car");
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const myOrders = getMyOrders(user?.id || "");
  const completedOrders = myOrders.filter(o => o.status === "completed");
  const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.finalPrice || 0), 0);
  const avgRating = completedOrders.filter(o => o.rating).reduce((sum, o) => sum + (o.rating || 0), 0) / (completedOrders.filter(o => o.rating).length || 1);

  // حساب المستوى
  const deliveriesCount = user?.totalDeliveries || 0;
  let level = "🥉 برونزي";
  let nextBonus = 50;
  let deliveriesToNext = 100 - (deliveriesCount % 100);
  if (deliveriesCount >= 100) level = "🥈 فضي";
  if (deliveriesCount >= 250) level = "🥇 ذهبي";
  if (deliveriesCount >= 500) level = "💎 بلاتيني";
  if (deliveriesCount >= 1000) level = "👑 ألماس";

  const handleSave = async () => {
    if (!user) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateUser({
      ...user,
      fullName,
      phone,
      neighborhood,
      vehicleType: selectedVehicle as any,
    });
    setIsEditing(false);
    Alert.alert("✅ تم الحفظ", "تم تحديث بياناتك الشخصية بنجاح");
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
    router.replace("/role-select");
  };

const menuItems = [
  { icon: "trending-up", label: "أرباحي", route: "/(driver)/earnings", color: "#28A745" },
  { icon: "award", label: "المكافآت والمستويات", route: "/(driver)/rewards", color: "#FFC107" },
  { icon: "users", label: "الوكلاء المعتمدون", route: "/(driver)/agents", color: "#6C63FF" },
  { icon: "bell", label: "الإشعارات", route: "/notifications", color: "#17A2B8" },
  { icon: "help-circle", label: "الدعم الفني", route: "/faq", color: "#FF6584" },
  { icon: "info", label: "عن التطبيق", route: "/(driver)/about", color: colors.textGray },
];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: "#28A745", paddingTop: topPad + 16 }]}>
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
            <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {user?.fullName?.charAt(0) || "س"}
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{level}</Text>
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
                <Text style={[styles.inputLabel, { color: colors.textGray }]}>الحي / المنطقة</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={neighborhood}
                  onChangeText={setNeighborhood}
                  placeholder="مثال: الرمال، الزيتون..."
                  placeholderTextColor={colors.textLight}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textGray }]}>نوع المركبة</Text>
                <TouchableOpacity
                  style={[styles.vehicleSelector, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowVehicleModal(true)}
                >
                  <Text style={[styles.vehicleSelectorText, { color: colors.foreground }]}>
                    {VEHICLE_OPTIONS.find(v => v.type === selectedVehicle)?.label || "اختر نوع المركبة"}
                  </Text>
                  <Feather name="chevron-down" size={18} color={colors.textGray} />
                </TouchableOpacity>
              </View>
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  onPress={() => {
                    setIsEditing(false);
                    setFullName(user?.fullName || "");
                    setPhone(user?.phone || "");
                    setNeighborhood(user?.neighborhood || "");
                    setSelectedVehicle(user?.vehicleType || "car");
                  }}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textGray }]}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: "#28A745" }]} onPress={handleSave}>
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
              {user?.neighborhood && (
                <View style={styles.infoRow}>
                  <Feather name="map-pin" size={14} color={colors.textGray} />
                  <Text style={[styles.infoText, { color: colors.textGray }]}>{user?.neighborhood}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Feather name="truck" size={14} color={colors.textGray} />
                <Text style={[styles.infoText, { color: colors.textGray }]}>
                  {VEHICLE_OPTIONS.find(v => v.type === user?.vehicleType)?.label || "سيارة"}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="check-circle" size={20} color="#28A745" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{completedOrders.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>توصيلات</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="star" size={20} color="#FFC107" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{avgRating > 0 ? avgRating.toFixed(1) : "—"}</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>التقييم</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="credit-card" size={20} color="#6C63FF" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{user?.commissionBalance || 0} ₪</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>الرصيد</Text>
          </View>
        </View>

        {/* Progress to Next Level */}
        {deliveriesToNext > 0 && deliveriesToNext < 100 && (
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.progressTitle, { color: colors.foreground }]}>🎯 التقدم للمستوى التالي</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${((deliveriesCount % 100) / 100) * 100}%`, backgroundColor: "#28A745" }]} />
              </View>
              <Text style={[styles.progressText, { color: colors.textGray }]}>
                {deliveriesCount % 100} / 100 توصيلة
              </Text>
            </View>
            <Text style={[styles.progressHint, { color: colors.textLight }]}>
              متبقي {deliveriesToNext} توصيلة للحصول على {nextBonus} ₪ مكافأة
            </Text>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuTitle, { color: colors.foreground }]}>القائمة</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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

      {/* Vehicle Selection Modal */}
      <Modal visible={showVehicleModal} transparent animationType="fade" onRequestClose={() => setShowVehicleModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowVehicleModal(false)}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>اختر نوع المركبة</Text>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <Feather name="x" size={22} color={colors.textGray} />
              </TouchableOpacity>
            </View>
            {VEHICLE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.vehicleOption,
                  {
                    backgroundColor: selectedVehicle === option.type ? colors.primary + "10" : colors.background,
                    borderColor: selectedVehicle === option.type ? colors.primary : colors.border,
                    borderWidth: selectedVehicle === option.type ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  setSelectedVehicle(option.type as any);
                  setShowVehicleModal(false);
                  Haptics.selectionAsync();
                }}
              >
                <Text style={styles.vehicleOptionEmoji}>{option.label}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.vehicleOptionLabel, { color: colors.foreground }]}>{option.label}</Text>
                  <Text style={[styles.vehicleOptionDesc, { color: colors.textGray }]}>{option.description}</Text>
                </View>
                {selectedVehicle === option.type && (
                  <Feather name="check-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
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
  levelBadge: { position: "absolute", bottom: -10, backgroundColor: "#28A745", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  levelText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  
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
  vehicleSelector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  vehicleSelectorText: { fontSize: 14 },
  editActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontWeight: "600" },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 10 },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  
  // Stats Grid
  statsGrid: { flexDirection: "row", gap: 12, padding: 16 },
  statCard: { flex: 1, alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1, gap: 6 },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11, textAlign: "center" },
  
  // Progress Card
  progressCard: { marginHorizontal: 16, marginBottom: 16, padding: 14, borderRadius: 14, borderWidth: 1, gap: 8 },
  progressTitle: { fontSize: 13, fontWeight: "700" },
  progressBarContainer: { gap: 4 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 11, textAlign: "center" },
  progressHint: { fontSize: 11, textAlign: "center" },
  
  // Menu Section
  menuSection: { paddingHorizontal: 16, marginBottom: 20 },
  menuTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  menuCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
  
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
  vehicleOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, marginBottom: 8 },
  vehicleOptionEmoji: { fontSize: 24 },
  vehicleOptionLabel: { fontSize: 14, fontWeight: "700" },
  vehicleOptionDesc: { fontSize: 11, marginTop: 2 },
});