// app/(driver)/profile.tsx
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState, useMemo, useCallback } from "react";
import {
  Alert,
  ActivityIndicator,
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
import { useOrders } from "@/context/OrdersContext";

const DRIVER_COLOR = "#28A745";
const DRIVER_DARK = "#1B5E20";

export default function DriverProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser, logout } = useAuth();
  const { getDriverActiveOrder } = useOrders(); // ✅ إزالة stats
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || "");
  const [email, setEmail] = useState(user?.email || "");
  const [vehicleType, setVehicleType] = useState(user?.vehicleType || "car");
  const [idNumber, setIdNumber] = useState(user?.idNumber || "");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  const activeOrder = getDriverActiveOrder(user?.id || "");
  const hasActiveOrder = !!activeOrder;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Alert.alert("خطأ", "حدث خطأ أثناء النسخ");
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await updateUser({
        ...user,
        fullName,
        neighborhood,
        email,
        vehicleType,
        idNumber,
      });
      setIsEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✅ تم الحفظ", "تم تحديث البيانات الشخصية بنجاح");
    } catch (error) {
      Alert.alert("❌ خطأ", "حدث خطأ أثناء حفظ البيانات");
    } finally {
      setIsLoading(false);
    }
  };

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

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "car": return "🚗";
      case "bike": return "🏍️";
      case "truck": return "🚚";
      default: return "🚗";
    }
  };

  const getVehicleName = (type: string) => {
    switch (type) {
      case "car": return "سيارة";
      case "bike": return "دراجة نارية";
      case "truck": return "شاحنة صغيرة";
      default: return "سيارة";
    }
  };

  const quickStats = useMemo(() => [
    { label: "إجمالي التوصيلات", value: user?.totalDeliveries || 0, icon: "truck", color: "#4CAF50" },
    { label: "التقييم", value: `${user?.rating || 0} ⭐`, icon: "star", color: "#FFC107" },
    { label: "رصيد العمولة", value: `${user?.commissionBalance || 0} ₪`, icon: "wallet", color: DRIVER_COLOR },
    { label: "حالة الحساب", value: user?.driverStatus === "active" ? "نشط" : "قيد المراجعة", icon: "user-check", color: user?.driverStatus === "active" ? "#4CAF50" : "#FFA63D" },
  ], [user]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header مع صورة البروفايل */}
        <View style={[styles.headerBackground, { backgroundColor: DRIVER_COLOR }]}>
          <View style={styles.avatarSection}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.avatarText, { color: DRIVER_COLOR }]}>
                {user?.fullName?.charAt(0) || "س"}
              </Text>
            </View>
            <Text style={[styles.userName, { color: "#fff" }]}>{user?.fullName || "السائق"}</Text>
            <View style={[styles.roleBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Feather name="truck" size={12} color="#fff" />
              <Text style={[styles.roleText, { color: "#fff" }]}>سائق</Text>
            </View>
          </View>
        </View>

        {/* حالة الطلب النشط */}
        {hasActiveOrder && (
          <TouchableOpacity 
            style={[styles.activeOrderCard, { backgroundColor: colors.card, borderColor: DRIVER_COLOR }]}
            onPress={() => router.push("/(driver)/order-details" as any)}
          >
            <Feather name="navigation" size={18} color={DRIVER_COLOR} />
            <View style={styles.activeOrderInfo}>
              <Text style={[styles.activeOrderTitle, { color: colors.foreground }]}>لديك طلب نشط</Text>
              <Text style={[styles.activeOrderSub, { color: colors.textGray }]}>اضغط لعرض التفاصيل</Text>
            </View>
            <Feather name="chevron-left" size={18} color={colors.textGray} />
          </TouchableOpacity>
        )}

        {/* بطاقة كود السائق */}
        <View style={[styles.codeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.codeCardLeft}>
            <View style={[styles.codeIcon, { backgroundColor: DRIVER_COLOR + "10" }]}>
              <Feather name="hash" size={18} color={DRIVER_COLOR} />
            </View>
            <View>
              <Text style={[styles.codeLabel, { color: colors.textGray }]}>كود السائق</Text>
              <Text style={[styles.codeValue, { color: colors.foreground }]}>{user?.id?.slice(-8) || "غير محدد"}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.copyBtn, { backgroundColor: DRIVER_COLOR + "10" }]} onPress={() => copyToClipboard(user?.id || "")}>
            <Feather name="copy" size={16} color={DRIVER_COLOR} />
            {copied && <Text style={[styles.copiedText, { color: DRIVER_COLOR }]}>تم!</Text>}
          </TouchableOpacity>
        </View>

        {/* الإحصائيات السريعة */}
        <View style={styles.statsContainer}>
          {quickStats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + "10" }]}>
                <Feather name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textGray }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* المعلومات الشخصية */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Feather name="user" size={18} color={DRIVER_COLOR} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>المعلومات الشخصية</Text>
            </View>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={[styles.editBtn, { backgroundColor: DRIVER_COLOR + "10" }]}>
              <Feather name={isEditing ? "x" : "edit-2"} size={14} color={DRIVER_COLOR} />
              <Text style={[styles.editBtnText, { color: DRIVER_COLOR }]}>{isEditing ? "إلغاء" : "تعديل"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Feather name="user" size={14} color={colors.textGray} />
              <Text style={[styles.infoLabel, { color: colors.textGray }]}>الاسم الكامل</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="أدخل اسمك الكامل"
                placeholderTextColor={colors.textLight}
              />
            ) : (
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{user?.fullName || "غير محدد"}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Feather name="map-pin" size={14} color={colors.textGray} />
              <Text style={[styles.infoLabel, { color: colors.textGray }]}>الحي</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                value={neighborhood}
                onChangeText={setNeighborhood}
                placeholder="أدخل اسم الحي"
                placeholderTextColor={colors.textLight}
              />
            ) : (
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{user?.neighborhood || "غير محدد"}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Feather name="mail" size={14} color={colors.textGray} />
              <Text style={[styles.infoLabel, { color: colors.textGray }]}>البريد الإلكتروني</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                value={email}
                onChangeText={setEmail}
                placeholder="example@email.com"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{user?.email || "غير مضاف"}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Feather name="credit-card" size={14} color={colors.textGray} />
              <Text style={[styles.infoLabel, { color: colors.textGray }]}>رقم الهوية</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                value={idNumber}
                onChangeText={setIdNumber}
                placeholder="رقم الهوية الشخصية"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
              />
            ) : (
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{user?.idNumber || "غير مضاف"}</Text>
            )}
          </View>

          {/* نوع المركبة */}
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Feather name="truck" size={14} color={colors.textGray} />
              <Text style={[styles.infoLabel, { color: colors.textGray }]}>نوع المركبة</Text>
            </View>
            {isEditing ? (
              <TouchableOpacity 
                style={[styles.vehicleSelector, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowVehicleModal(true)}
              >
                <Text style={[styles.vehicleText, { color: colors.foreground }]}>
                  {getVehicleIcon(vehicleType)} {getVehicleName(vehicleType)}
                </Text>
                <Feather name="chevron-down" size={16} color={colors.textGray} />
              </TouchableOpacity>
            ) : (
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {getVehicleIcon(user?.vehicleType || "car")} {getVehicleName(user?.vehicleType || "car")}
              </Text>
            )}
          </View>

          {isEditing && (
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: DRIVER_COLOR }]} onPress={handleSave} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>حفظ التغييرات</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* أزرار الإجراءات السريعة */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push("/(driver)/earnings" as any)}>
            <Feather name="trending-up" size={18} color={DRIVER_COLOR} />
            <Text style={[styles.actionText, { color: DRIVER_COLOR }]}>أرباحي</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push("/(driver)/my-orders" as any)}>
            <Feather name="list" size={18} color={DRIVER_COLOR} />
            <Text style={[styles.actionText, { color: DRIVER_COLOR }]}>طلباتي</Text>
          </TouchableOpacity>
          {hasActiveOrder && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push("/(driver)/track-delivery" as any)}>
              <Feather name="map-pin" size={18} color={DRIVER_COLOR} />
              <Text style={[styles.actionText, { color: DRIVER_COLOR }]}>تتبع</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* زر تسجيل الخروج */}
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.destructive + "10", borderColor: colors.destructive }]} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>تسجيل الخروج</Text>
        </TouchableOpacity>

        {/* إصدار التطبيق */}
        <View style={styles.footer}>
          <Text style={[styles.version, { color: colors.textLight }]}>الإصدار 1.0.0</Text>
          <Text style={[styles.copyright, { color: colors.textLight }]}>© 2026 سريع - جميع الحقوق محفوظة</Text>
        </View>
      </ScrollView>

      {/* مودال اختيار نوع المركبة */}
      <Modal visible={showVehicleModal} transparent animationType="fade" onRequestClose={() => setShowVehicleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>اختر نوع المركبة</Text>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <Feather name="x" size={22} color={colors.textGray} />
              </TouchableOpacity>
            </View>

            <View style={styles.vehicleOptions}>
              {[
                { value: "car", label: "سيارة", icon: "🚗" },
                { value: "bike", label: "دراجة نارية", icon: "🏍️" },
                { value: "truck", label: "شاحنة صغيرة", icon: "🚚" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.vehicleOption, vehicleType === option.value && { backgroundColor: DRIVER_COLOR + "10", borderColor: DRIVER_COLOR }]}
                  onPress={() => {
                    setVehicleType(option.value as "car" | "bike" | "truck");
                    setShowVehicleModal(false);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={styles.vehicleOptionIcon}>{option.icon}</Text>
                  <Text style={[styles.vehicleOptionLabel, { color: colors.foreground }]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingBottom: 40 },
  
  headerBackground: { 
    height: 200, 
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarSection: { 
    alignItems: "center", 
    paddingTop: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  
  activeOrderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: -20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  activeOrderInfo: { flex: 1 },
  activeOrderTitle: { fontSize: 14, fontWeight: "700" },
  activeOrderSub: { fontSize: 11, marginTop: 2 },
  
  codeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  codeCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  codeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  codeValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copiedText: {
    fontSize: 10,
    fontWeight: "600",
  },
  
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 10,
    textAlign: "center",
  },
  
  infoCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  infoRow: {
    marginBottom: 14,
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    paddingVertical: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  vehicleSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  vehicleText: { fontSize: 14 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  
  actionsContainer: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
  },
  
  footer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  version: {
    fontSize: 11,
  },
  copyright: {
    fontSize: 10,
    marginTop: 4,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 350,
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  vehicleOptions: { gap: 12 },
  vehicleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  vehicleOptionIcon: { fontSize: 28 },
  vehicleOptionLabel: { fontSize: 16, fontWeight: "600" },
});