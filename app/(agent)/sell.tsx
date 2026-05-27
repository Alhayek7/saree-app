// app/(agent)/sell.tsx - الجزء المعدل فقط

import { useAgent } from "@/context/AgentContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
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

const AGENT_COLOR = "#9C27B0";

// الباقات المعدلة (السعر = عدد الطلبات)
const PREMIUM_PACKAGES = [
  { id: 1, orders: 5, price: 5, label: "باقة المبتدئ", icon: "🌱", color: "#4CAF50", bgLight: "#E8F5E9" },
  { id: 2, orders: 10, price: 10, label: "الباقة الأكثر طلباً", icon: "⭐", color: "#FF9800", bgLight: "#FFF3E0", popular: true },
  { id: 3, orders: 20, price: 20, label: "الباقة الموفّرة", icon: "🚀", color: "#2196F3", bgLight: "#E3F2FD" },
  { id: 4, orders: 50, price: 50, label: "الباقة الذهبية", icon: "👑", color: "#FFC107", bgLight: "#FFF8E1" },
  { id: 5, orders: 100, price: 100, label: "الباقة البلاتينية", icon: "💎", color: "#9C27B0", bgLight: "#F3E5F5" },
  { id: 6, orders: 200, price: 200, label: "الباقة الماسية", icon: "✨", color: "#00BCD4", bgLight: "#E0F7FA" },
  { id: 7, orders: 500, price: 500, label: "باقة الوكيل المحترف", icon: "🏆", color: "#FF5722", bgLight: "#FBE9E7" },
  { id: 8, orders: 1000, price: 1000, label: "باقة الوكيل الذهبي", icon: "👑", color: "#FFD700", bgLight: "#FFF8E1" },
];

// قاعدة بيانات تجريبية للعملاء (موسعة)
const CUSTOMERS_DB = [
  // سائقين
  { id: "1", name: "أحمد محمد", phone: "0591234567", type: "سائق", avatar: "🚗", balance: 0 },
  { id: "2", name: "محمد سعيد", phone: "0597654321", type: "سائق", avatar: "🏍️", balance: 0 },
  { id: "3", name: "خالد أحمد", phone: "0591122334", type: "سائق", avatar: "🚗", balance: 0 },
  { id: "4", name: "سامي نصر", phone: "0592233445", type: "سائق", avatar: "🏍️", balance: 0 },
  { id: "5", name: "عمر رشيد", phone: "0593344556", type: "سائق", avatar: "🚚", balance: 0 },
  { id: "6", name: "يوسف إبراهيم", phone: "0594455667", type: "سائق", avatar: "🚗", balance: 0 },
  
  // متاجر
  { id: "7", name: "متجر الأمل", phone: "0598887777", type: "متجر", avatar: "🏪", balance: 0 },
  { id: "8", name: "بقالة السلام", phone: "0591112222", type: "متجر", avatar: "🏬", balance: 0 },
  { id: "9", name: "سوبر ماركت النور", phone: "0592223333", type: "متجر", avatar: "🏪", balance: 0 },
  { id: "10", name: "مخبز السعادة", phone: "0593334444", type: "متجر", avatar: "🥖", balance: 0 },
  { id: "11", name: "صيدلية الحكمة", phone: "0594445555", type: "متجر", avatar: "💊", balance: 0 },
  { id: "12", name: "متجر الإلكترونيات", phone: "0595556666", type: "متجر", avatar: "📱", balance: 0 },
  
  // عملاء عاديين
  { id: "13", name: "نور إبراهيم", phone: "0595556666", type: "عميل", avatar: "👤", balance: 0 },
  { id: "14", name: "ليلى محمود", phone: "0596667777", type: "عميل", avatar: "👩", balance: 0 },
  { id: "15", name: "محمود علي", phone: "0597778888", type: "عميل", avatar: "👨", balance: 0 },
  { id: "16", name: "سارة خالد", phone: "0598889999", type: "عميل", avatar: "👩", balance: 0 },
  { id: "17", name: "أمير وسام", phone: "0599990000", type: "عميل", avatar: "👨", balance: 0 },
  { id: "18", name: "هناء عادل", phone: "0590001111", type: "عميل", avatar: "👩", balance: 0 },
];

export default function AgentSellScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sellToCustomer, getBalance, checkLowBalance } = useAgent();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [phone, setPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<typeof PREMIUM_PACKAGES[0] | null>(null);
  const [customOrders, setCustomOrders] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [searching, setSearching] = useState(false); // ✅ حالة البحث
  
  const balance = getBalance();
  const isLowBalance = checkLowBalance();

  // ✅ البحث عن العميل في قاعدة البيانات (تطابق تام)
  const searchCustomer = (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    setSearching(true);
    // محاكاة تأخير البحث
    setTimeout(() => {
      const filtered = CUSTOMERS_DB.filter(c => 
        c.phone === query || // تطابق تام لرقم الجوال
        c.name.toLowerCase().includes(query.toLowerCase()) // تطابق جزئي للاسم
      );
      setSearchResults(filtered);
      setShowResults(filtered.length > 0);
      setSearching(false);
    }, 300);
  };

  // ✅ عند تغيير النص، يتم البحث
  useEffect(() => {
    searchCustomer(phone);
  }, [phone]);

  // ✅ اختيار العميل من نتائج البحث
  const selectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setPhone(customer.phone);
    setShowResults(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const selectPackage = (pkg: typeof PREMIUM_PACKAGES[0]) => {
    setSelectedPackage(pkg);
    setIsCustomMode(false);
    setCustomOrders("");
    Haptics.selectionAsync().catch(() => {});
  };

  const selectCustomMode = () => {
    setIsCustomMode(true);
    setSelectedPackage(null);
    Haptics.selectionAsync().catch(() => {});
  };

  const handleCustomOrdersChange = (text: string) => {
    setCustomOrders(text);
    if (parseInt(text) > 0) {
      setSelectedPackage(null);
    }
  };

  const getTotalPrice = () => {
    if (selectedPackage) return selectedPackage.price;
    if (customOrders) {
      const orders = parseInt(customOrders);
      if (!isNaN(orders) && orders > 0) {
        return orders;
      }
    }
    return 0;
  };

  const getOrdersCount = () => {
    if (selectedPackage) return selectedPackage.orders;
    if (customOrders) return parseInt(customOrders) || 0;
    return 0;
  };

  // ✅ التحقق من إمكانية البيع (تم اختيار العميل وتم اختيار الكمية)
  const canSell = () => {
    return selectedCustomer !== null && (selectedPackage !== null || (customOrders && parseInt(customOrders) > 0));
  };

  const handleSell = async () => {
    const count = getOrdersCount();
    const price = getTotalPrice();
    
    if (!selectedCustomer) {
      Alert.alert("تنبيه", "الرجاء اختيار العميل أولاً");
      return;
    }
    
    if (count < 1) {
      Alert.alert("تنبيه", "الرجاء اختيار باقة أو إدخال عدد طلبات صالح");
      return;
    }
    
    if (balance.availableOrders < count) {
      Alert.alert("⚠️ رصيد غير كافٍ", 
        `الرصيد المتاح: ${balance.availableOrders} طلب\nالمطلوب: ${count} طلب\nالعجز: ${count - balance.availableOrders} طلب`,
        [
          { text: "إلغاء", style: "cancel" },
          { text: "شحن الرصيد", onPress: () => router.push("/(agent)/recharge") }
        ]
      );
      return;
    }
    
    setLoading(true);
    try {
      const result = await sellToCustomer(selectedCustomer.phone, count);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLastSale({ 
          customerName: selectedCustomer.name, 
          ordersCount: count,
          price: price,
          customerAvatar: selectedCustomer.avatar
        });
        setSuccessModal(true);
        setSelectedCustomer(null);
        setPhone("");
        setSelectedPackage(null);
        setCustomOrders("");
        setIsCustomMode(false);
      } else {
        Alert.alert("تنبيه", result.message);
      }
    } catch (error) {
      Alert.alert("خطأ", "حدث خطأ أثناء عملية البيع");
    } finally {
      setLoading(false);
    }
  };

  const ordersCount = getOrdersCount();
  const totalPrice = getTotalPrice();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: AGENT_COLOR, paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>بيع رصيد</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* الرصيد الحالي */}
        <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.balanceHeader}>
            <Feather name="package" size={20} color={AGENT_COLOR} />
            <Text style={[styles.balanceLabel, { color: colors.textGray }]}>الرصيد المتاح</Text>
          </View>
          <Text style={[styles.balanceValue, { color: isLowBalance ? "#DC3545" : AGENT_COLOR }]}>
            {balance.availableOrders}
          </Text>
          <Text style={[styles.balanceUnit, { color: colors.textGray }]}>طلب متاح</Text>
          
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min((balance.availableOrders / 1000) * 100, 100)}%`,
                    backgroundColor: isLowBalance ? "#DC3545" : AGENT_COLOR 
                  }
                ]} 
              />
            </View>
          </View>

          {isLowBalance && (
            <TouchableOpacity 
              style={[styles.rechargeBtn, { backgroundColor: AGENT_COLOR }]}
              onPress={() => router.push("/(agent)/recharge")}
            >
              <Feather name="refresh-cw" size={14} color="#fff" />
              <Text style={styles.rechargeBtnText}>شحن الرصيد</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* البحث عن العميل */}
        <View style={[styles.searchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>👤 اختيار العميل</Text>
          
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color={colors.textGray} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="أدخل رقم الجوال أو الاسم"
              placeholderTextColor={colors.textLight}
              value={phone}
              onChangeText={setPhone}
            />
            {searching && (
              <ActivityIndicator size="small" color={AGENT_COLOR} style={styles.searchIndicator} />
            )}
          </View>

          {showResults && searchResults.length > 0 && (
            <View style={[styles.resultsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {searchResults.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  style={styles.resultItem}
                  onPress={() => selectCustomer(customer)}
                >
                  <Text style={styles.customerAvatar}>{customer.avatar}</Text>
                  <View style={styles.resultInfo}>
                    <Text style={[styles.customerName, { color: colors.foreground }]}>{customer.name}</Text>
                    <Text style={[styles.customerPhone, { color: colors.textGray }]}>{customer.phone}</Text>
                  </View>
                  <View style={styles.customerBadge}>
                    <Text style={styles.customerType}>{customer.type}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!showResults && phone.length > 3 && !searching && (
            <View style={[styles.noResults, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="user-x" size={24} color={colors.textLight} />
              <Text style={[styles.noResultsText, { color: colors.textGray }]}>لا يوجد عميل بهذا الرقم أو الاسم</Text>
            </View>
          )}

          {selectedCustomer && (
            <View style={[styles.selectedCustomer, { backgroundColor: AGENT_COLOR + "10", borderColor: AGENT_COLOR }]}>
              <Text style={styles.selectedCustomerAvatar}>{selectedCustomer.avatar}</Text>
              <View style={styles.selectedCustomerInfo}>
                <Text style={[styles.selectedCustomerName, { color: colors.foreground }]}>{selectedCustomer.name}</Text>
                <Text style={[styles.selectedCustomerPhone, { color: colors.textGray }]}>{selectedCustomer.phone}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                <Feather name="x" size={18} color={colors.textGray} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* الباقات (تظهر فقط بعد اختيار العميل) */}
        {selectedCustomer && (
          <View style={[styles.packagesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>🎁 اختر الباقة</Text>
              <TouchableOpacity onPress={selectCustomMode}>
                <Text style={[styles.customLink, { color: AGENT_COLOR }]}>+ كمية مفتوحة</Text>
              </TouchableOpacity>
            </View>

            {!isCustomMode ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packagesScroll}>
                <View style={styles.packagesRow}>
                  {PREMIUM_PACKAGES.map((pkg) => (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[
                        styles.packageCard,
                        { backgroundColor: pkg.bgLight, borderColor: selectedPackage?.id === pkg.id ? pkg.color : colors.border },
                        selectedPackage?.id === pkg.id && styles.packageCardActive
                      ]}
                      onPress={() => selectPackage(pkg)}
                    >
                      <Text style={styles.packageIcon}>{pkg.icon}</Text>
                      <Text style={[styles.packageOrders, { color: pkg.color }]}>{pkg.orders}</Text>
                      <Text style={[styles.packageLabel, { color: colors.textGray }]}>{pkg.label}</Text>
                      <Text style={[styles.packagePrice, { color: pkg.color, fontWeight: "800" }]}>{pkg.price} ₪</Text>
                      {selectedPackage?.id === pkg.id && (
                        <View style={[styles.checkMark, { backgroundColor: pkg.color }]}>
                          <Feather name="check" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.customBox}>
                <View style={styles.customInputWrapper}>
                  <TextInput
                    style={[styles.customInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="أدخل عدد الطلبات"
                    placeholderTextColor={colors.textLight}
                    keyboardType="numeric"
                    value={customOrders}
                    onChangeText={handleCustomOrdersChange}
                  />
                  <Text style={[styles.customUnit, { color: colors.textGray }]}>طلب</Text>
                </View>
                <TouchableOpacity style={styles.backToPackages} onPress={() => setIsCustomMode(false)}>
                  <Feather name="arrow-right" size={14} color={AGENT_COLOR} />
                  <Text style={[styles.backToPackagesText, { color: AGENT_COLOR }]}>العودة للباقات</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* الملخص */}
        {(selectedPackage || (customOrders && parseInt(customOrders) > 0)) && selectedCustomer && (
          <View style={[styles.summaryCard, { backgroundColor: AGENT_COLOR + "08", borderColor: AGENT_COLOR + "30" }]}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>📋 ملخص الطلب</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textGray }]}>العميل</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground, fontWeight: "700" }]}>{selectedCustomer.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textGray }]}>عدد الطلبات</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground, fontWeight: "700" }]}>{ordersCount} طلب</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textGray }]}>المبلغ الإجمالي</Text>
              <Text style={[styles.totalPrice, { color: AGENT_COLOR, fontWeight: "800" }]}>{totalPrice} ₪</Text>
            </View>
          </View>
        )}

        {/* زر البيع - يتم تفعيله فقط بعد اختيار العميل والكمية */}
        <TouchableOpacity
          style={[
            styles.sellBtn, 
            { 
              backgroundColor: canSell() ? AGENT_COLOR : "#CCCCCC",
              opacity: loading ? 0.7 : 1 
            }
          ]}
          onPress={handleSell}
          disabled={!canSell() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="shopping-cart" size={18} color="#fff" />
              <Text style={styles.sellBtnText}>
                {canSell() ? `بيع ${ordersCount} طلب لـ ${selectedCustomer?.name}` : "أكمل بيانات العميل والكمية"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* مودال النجاح */}
      <Modal visible={successModal} transparent animationType="fade" onRequestClose={() => setSuccessModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIcon, { backgroundColor: "#E8F5E9" }]}>
              <Feather name="check-circle" size={40} color="#28A745" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>✅ تم البيع بنجاح!</Text>
            <Text style={[styles.modalText, { color: colors.textGray }]}>
              تم شحن {lastSale?.ordersCount} طلب للعميل {lastSale?.customerName}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: AGENT_COLOR }]}
                onPress={() => setSuccessModal(false)}
              >
                <Text style={styles.modalBtnText}>حسناً</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnSecondary, { borderColor: AGENT_COLOR }]}
                onPress={() => {
                  setSuccessModal(false);
                  router.push("/(agent)/sell");
                }}
              >
                <Text style={[styles.modalBtnSecondaryText, { color: AGENT_COLOR }]}>بيع جديد</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (جميع الـ styles السابقة موجودة)
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  container: { padding: 16, gap: 16, paddingBottom: 40 },
  
  balanceCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  balanceHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  balanceLabel: { fontSize: 12 },
  balanceValue: { fontSize: 36, fontWeight: "800", textAlign: "center" },
  balanceUnit: { fontSize: 11, textAlign: "center", marginTop: 4 },
  progressBarContainer: { marginTop: 12 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  rechargeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 20, marginTop: 12 },
  rechargeBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  
  searchCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  searchContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, backgroundColor: "#F5F5F5" },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14 },
  searchIndicator: { marginLeft: 8 },
  resultsList: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  resultItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12, borderBottomWidth: 0.5, borderBottomColor: "#E5E5E5" },
  customerAvatar: { fontSize: 24 },
  resultInfo: { flex: 1 },
  customerName: { fontSize: 14, fontWeight: "600" },
  customerPhone: { fontSize: 11, marginTop: 2 },
  customerBadge: { backgroundColor: "#E8F5E9", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  customerType: { fontSize: 10, fontWeight: "600", color: "#4CAF50" },
  noResults: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderRadius: 12, borderWidth: 1, justifyContent: "center" },
  noResultsText: { fontSize: 13 },
  selectedCustomer: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  selectedCustomerAvatar: { fontSize: 28 },
  selectedCustomerInfo: { flex: 1 },
  selectedCustomerName: { fontSize: 15, fontWeight: "700" },
  selectedCustomerPhone: { fontSize: 12, marginTop: 2 },
  
  packagesCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  customLink: { fontSize: 12, fontWeight: "600" },
  packagesScroll: { flexGrow: 0 },
  packagesRow: { flexDirection: "row", gap: 12 },
  packageCard: { width: 100, padding: 10, borderRadius: 14, borderWidth: 1, alignItems: "center", position: "relative" },
  packageCardActive: { borderWidth: 2 },
  packageIcon: { fontSize: 28, marginBottom: 4 },
  packageOrders: { fontSize: 20, fontWeight: "800" },
  packageLabel: { fontSize: 10, marginTop: 4, textAlign: "center" },
  packagePrice: { fontSize: 12, marginTop: 6 },
  checkMark: { position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  
  customBox: { gap: 12 },
  customInputWrapper: { flexDirection: "row", alignItems: "center", gap: 8 },
  customInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  customUnit: { fontSize: 14, fontWeight: "600" },
  backToPackages: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8 },
  backToPackagesText: { fontSize: 12, fontWeight: "600" },
  
  summaryCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  summaryTitle: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 14 },
  summaryDivider: { height: 1, backgroundColor: "#E5E5E5", marginVertical: 4 },
  totalPrice: { fontSize: 18 },
  
  sellBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 2, marginBottom: 40 },
  sellBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalCard: { width: "85%", borderRadius: 20, padding: 24, alignItems: "center" },
  modalIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  modalText: { fontSize: 14, textAlign: "center", marginBottom: 20 },
  modalActions: { flexDirection: "row", gap: 10, width: "100%" },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  modalBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  modalBtnSecondary: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  modalBtnSecondaryText: { fontSize: 14, fontWeight: "700" },
});