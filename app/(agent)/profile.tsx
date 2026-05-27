// app/(agent)/profile.tsx - الإصلاح
import { useAuth } from "@/context/AuthContext";
import { useAgent } from "@/context/AgentContext";
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

const AGENT_COLOR = "#9C27B0";

export default function AgentProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser, logout } = useAuth();
  const { getBalance, stats } = useAgent();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bankAccount, setBankAccount] = useState({
    bankName: user?.bankAccount?.bankName || "",
    accountName: user?.bankAccount?.accountName || "",
    accountNumber: user?.bankAccount?.accountNumber || "",
    iban: user?.bankAccount?.iban || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showBankEditModal, setShowBankEditModal] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // ✅ استخدام useMemo لمنع إعادة الحساب غير الضرورية
  const balance = useMemo(() => getBalance(), [getBalance]);

  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(type);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      Alert.alert("خطأ", "حدث خطأ أثناء النسخ");
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await updateUser({
        ...user,
        fullName,
        neighborhood,
        email,
      });
      setIsEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✅ تم الحفظ", "تم تحديث البيانات الشخصية بنجاح");
    } catch (error) {
      Alert.alert("❌ خطأ", "حدث خطأ أثناء حفظ البيانات");
    } finally {
      setIsLoading(false);
    }
  }, [user, fullName, neighborhood, email, updateUser]);

  const handleSaveBank = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await updateUser({
        ...user,
        bankAccount: {
          bankName: bankAccount.bankName,
          accountName: bankAccount.accountName,
          accountNumber: bankAccount.accountNumber,
          iban: bankAccount.iban,
        },
      });
      setShowBankEditModal(false);
      setIsEditingBank(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✅ تم الحفظ", "تم تحديث المعلومات البنكية بنجاح");
    } catch (error) {
      Alert.alert("❌ خطأ", "حدث خطأ أثناء حفظ البيانات");
    } finally {
      setIsLoading(false);
    }
  }, [user, bankAccount, updateUser]);

  const handleLogout = useCallback(() => {
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
  }, [logout, router]);

  // ✅ استخدام useMemo للإحصائيات
  const quickStats = useMemo(() => [
    { label: "إجمالي المبيعات", value: stats.totalSales, icon: "shopping-cart", color: "#4CAF50" },
    { label: "رصيد الطلبات", value: balance.availableOrders, icon: "package", color: AGENT_COLOR },
    { label: "إجمالي العمولة", value: `${stats.totalCommission.toFixed(2)} ₪`, icon: "trending-up", color: "#FFA63D" },
  ], [stats, balance]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={[styles.headerBackground, { backgroundColor: AGENT_COLOR }]}>
          <View style={styles.avatarSection}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.avatarText, { color: AGENT_COLOR }]}>
                {user?.fullName?.charAt(0) || "و"}
              </Text>
            </View>
            <Text style={[styles.userName, { color: "#fff" }]}>{user?.fullName || "الوكيل"}</Text>
            <View style={[styles.roleBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Feather name="briefcase" size={12} color="#fff" />
              <Text style={[styles.roleText, { color: "#fff" }]}>وكيل محلي</Text>
            </View>
          </View>
        </View>

        {/* Agent Code Card */}
        <View style={[styles.codeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.codeCardLeft}>
            <View style={[styles.codeIcon, { backgroundColor: AGENT_COLOR + "10" }]}>
              <Feather name="hash" size={18} color={AGENT_COLOR} />
            </View>
            <View>
              <Text style={[styles.codeLabel, { color: colors.textGray }]}>كود الوكيل</Text>
              <Text style={[styles.codeValue, { color: colors.foreground }]}>{user?.agentCode || "AGT001"}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.copyBtn, { backgroundColor: AGENT_COLOR + "10" }]} 
            onPress={() => copyToClipboard(user?.agentCode || "AGT001", "code")}
          >
            <Feather name="copy" size={16} color={AGENT_COLOR} />
            {copiedText === "code" && <Text style={[styles.copiedText, { color: AGENT_COLOR }]}>تم!</Text>}
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
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

        {/* Personal Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Feather name="user" size={18} color={AGENT_COLOR} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>المعلومات الشخصية</Text>
            </View>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={[styles.editBtn, { backgroundColor: AGENT_COLOR + "10" }]}>
              <Feather name={isEditing ? "x" : "edit-2"} size={14} color={AGENT_COLOR} />
              <Text style={[styles.editBtnText, { color: AGENT_COLOR }]}>{isEditing ? "إلغاء" : "تعديل"}</Text>
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

          {isEditing && (
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: AGENT_COLOR }]} onPress={handleSave} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>حفظ التغييرات</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* Bank Account Card - View Only */}
        <TouchableOpacity 
          style={[styles.bankCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowBankModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.bankCardLeft}>
            <View style={[styles.bankIcon, { backgroundColor: AGENT_COLOR + "10" }]}>
              <Feather name="credit-card" size={18} color={AGENT_COLOR} />
            </View>
            <View>
              <Text style={[styles.bankLabel, { color: colors.textGray }]}>المعلومات البنكية</Text>
              <Text style={[styles.bankValue, { color: colors.foreground }]}>
                {user?.bankAccount?.bankName ? user.bankAccount.bankName : "غير مضاف"}
              </Text>
            </View>
          </View>
          <Feather name="chevron-left" size={20} color={colors.textGray} />
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push("/(agent)/sell")}>
            <Feather name="shopping-cart" size={18} color={AGENT_COLOR} />
            <Text style={[styles.actionText, { color: AGENT_COLOR }]}>بيع</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push("/(agent)/recharge")}>
            <Feather name="refresh-cw" size={18} color={AGENT_COLOR} />
            <Text style={[styles.actionText, { color: AGENT_COLOR }]}>شحن</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push("/(agent)/commissions")}>
            <Feather name="trending-up" size={18} color={AGENT_COLOR} />
            <Text style={[styles.actionText, { color: AGENT_COLOR }]}>أرباحي</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.destructive + "10", borderColor: colors.destructive }]} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>تسجيل الخروج</Text>
        </TouchableOpacity>

        {/* Version */}
        <View style={styles.footer}>
          <Text style={[styles.version, { color: colors.textLight }]}>الإصدار 1.0.0</Text>
          <Text style={[styles.copyright, { color: colors.textLight }]}>© 2026 سريع - جميع الحقوق محفوظة</Text>
        </View>
      </ScrollView>

      {/* Bank Info Modal - View Only */}
      <Modal visible={showBankModal} transparent animationType="fade" onRequestClose={() => setShowBankModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>🏦 المعلومات البنكية</Text>
              <TouchableOpacity onPress={() => setShowBankModal(false)}>
                <Feather name="x" size={22} color={colors.textGray} />
              </TouchableOpacity>
            </View>

            <View style={[styles.bankInfoCard, { backgroundColor: colors.background }]}>
              <View style={styles.bankInfoRow}>
                <Text style={[styles.bankInfoLabel, { color: colors.textGray }]}>اسم البنك</Text>
                <Text style={[styles.bankInfoValue, { color: colors.foreground }]}>{user?.bankAccount?.bankName || "غير مضاف"}</Text>
              </View>
              <View style={styles.bankInfoRow}>
                <Text style={[styles.bankInfoLabel, { color: colors.textGray }]}>اسم صاحب الحساب</Text>
                <Text style={[styles.bankInfoValue, { color: colors.foreground }]}>{user?.bankAccount?.accountName || "غير مضاف"}</Text>
              </View>
              <View style={styles.bankInfoRow}>
                <Text style={[styles.bankInfoLabel, { color: colors.textGray }]}>رقم الحساب</Text>
                <Text style={[styles.bankInfoValue, { color: colors.foreground }]}>{user?.bankAccount?.accountNumber || "غير مضاف"}</Text>
              </View>
              {user?.bankAccount?.iban && (
                <View style={styles.bankInfoRow}>
                  <Text style={[styles.bankInfoLabel, { color: colors.textGray }]}>IBAN</Text>
                  <Text style={[styles.bankInfoValue, { color: colors.foreground }]}>{user.bankAccount.iban}</Text>
                </View>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowBankModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.foreground }]}>إغلاق</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalEditBtn, { backgroundColor: AGENT_COLOR }]}
                onPress={() => {
                  setShowBankModal(false);
                  setShowBankEditModal(true);
                  setBankAccount({
                    bankName: user?.bankAccount?.bankName || "",
                    accountName: user?.bankAccount?.accountName || "",
                    accountNumber: user?.bankAccount?.accountNumber || "",
                    iban: user?.bankAccount?.iban || "",
                  });
                }}
              >
                <Feather name="edit-2" size={16} color="#fff" />
                <Text style={styles.modalEditText}>تعديل</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bank Edit Modal */}
      <Modal visible={showBankEditModal} transparent animationType="fade" onRequestClose={() => setShowBankEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>✏️ تعديل المعلومات البنكية</Text>
              <TouchableOpacity onPress={() => setShowBankEditModal(false)}>
                <Feather name="x" size={22} color={colors.textGray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textGray }]}>اسم البنك</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={bankAccount.bankName}
                  onChangeText={(text) => setBankAccount(prev => ({ ...prev, bankName: text }))}
                  placeholder="مثال: بنك فلسطين"
                  placeholderTextColor={colors.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textGray }]}>اسم صاحب الحساب</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={bankAccount.accountName}
                  onChangeText={(text) => setBankAccount(prev => ({ ...prev, accountName: text }))}
                  placeholder="الاسم كما في البنك"
                  placeholderTextColor={colors.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textGray }]}>رقم الحساب</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={bankAccount.accountNumber}
                  onChangeText={(text) => setBankAccount(prev => ({ ...prev, accountNumber: text }))}
                  placeholder="رقم الحساب البنكي"
                  placeholderTextColor={colors.textLight}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textGray }]}>IBAN (اختياري)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={bankAccount.iban}
                  onChangeText={(text) => setBankAccount(prev => ({ ...prev, iban: text }))}
                  placeholder="IBAN"
                  placeholderTextColor={colors.textLight}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowBankEditModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.foreground }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: AGENT_COLOR }]}
                onPress={handleSaveBank}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSaveText}>حفظ</Text>}
              </TouchableOpacity>
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
  
  codeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: -20,
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
    gap: 12,
    marginHorizontal: 16,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
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
  
  bankCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  bankCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bankIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  bankLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  bankValue: {
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
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    maxHeight: "80%",
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
  modalContent: {
    maxHeight: 400,
  },
  bankInfoCard: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  bankInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bankInfoLabel: {
    fontSize: 12,
  },
  bankInfoValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalEditBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalEditText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalSaveText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});