import { useAuth } from "@/context/AuthContext";
import { useOrders, VehicleType, PaymentMethod } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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

const STEPS = ["العناوين", "الطرد", "المركبة"];

const VEHICLES: { type: VehicleType; label: string; sub: string; icon: string; color: string; examples: string }[] = [
  {
    type: "bike",
    label: "باسكليت",
    sub: "للطرود الصغيرة والسريعة",
    icon: "🚲",
    color: "#28A745",
    examples: "رسائل، مستندات، طرود صغيرة",
  },
  {
    type: "car",
    label: "سيارة",
    sub: "للطرود المتوسطة",
    icon: "🚗",
    color: "#6C63FF",
    examples: "ملابس، أجهزة إلكترونية، مشتريات",
  },
  {
    type: "truck",
    label: "سيارة نقل",
    sub: "للأغراض الكبيرة والثقيلة",
    icon: "🚛",
    color: "#FF6584",
    examples: "أثاث، ثلاجات، مواد بناء",
  },
];
const QUICK_ITEMS = [
  { label: "ملابس", icon: "👕", description: "ملابس وأزياء" },
  { label: "أجهزة إلكترونية", icon: "📱", description: "هواتف، لابتوبات، أجهزة" },
  { label: "طعام", icon: "🍕", description: "وجبات، طلبات مطاعم" },
  { label: "مستندات", icon: "📄", description: "أوراق، عقود، ملفات" },
  { label: "أدوية", icon: "💊", description: "أدوية ومستلزمات طبية" },
  { label: "هدايا", icon: "🎁", description: "هدايا ومنتجات" },
];


export default function NewOrderScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, addSavedAddress } = useAuth();
  const { createOrder } = useOrders();
  

  const [step, setStep] = useState(0);
  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [description, setDescription] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "electronic">("cash");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const savedAddresses = user?.savedAddresses ?? [];

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!pickup.trim()) e.pickup = "أدخل موقع الاستلام";
      if (!delivery.trim()) e.delivery = "أدخل موقع التسليم";
    }
    // if (s === 1) {
    //   // if (!description.trim()) e.description = "أدخل وصفاً للطرد";
    // }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    Haptics.selectionAsync();
    setStep((s) => s + 1);
  };

  const back = () => {
    setErrors({});
    if (step === 0) router.back();
    else setStep((s) => s - 1);
  };

const submit = async () => {
  if (!user) return;
  setLoading(true);
  await new Promise((r) => setTimeout(r, 800));
  const order = createOrder({
    customerId: user.id,
    pickupAddress: pickup.trim(),
    deliveryAddress: delivery.trim(),
    packageDescription: description.trim(),
    vehicleType,
    paymentMethod: paymentMethod === "cash" ? "cash" : "electronic",
  });
  
  // ✅ حفظ العناوين الجديدة
  // حفظ عنوان الاستلام إذا كان جديداً
  const existingPickup = user.savedAddresses?.some(a => a.address === pickup.trim());
  if (!existingPickup && pickup.trim()) {
    addSavedAddress({
      label: "الاستلام",
      address: pickup.trim(),
      icon: "map-pin",
    });
  }
  
  // حفظ عنوان التسليم إذا كان جديداً
  const existingDelivery = user.savedAddresses?.some(a => a.address === delivery.trim());
  if (!existingDelivery && delivery.trim()) {
    addSavedAddress({
      label: delivery.trim(),
      address: delivery.trim(),
      icon: "map-pin",
    });
  }
  
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  setLoading(false);
  router.replace({ pathname: "/track-order", params: { orderId: order.id } });
};

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: 4 }]}>
          <TouchableOpacity onPress={back} style={styles.backBtn}>
            <Feather name="arrow-right" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>طلب توصيل جديد</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Step indicator */}
        <View style={[styles.stepBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {STEPS.map((label, i) => (
            <View key={i} style={styles.stepItem}>
              <TouchableOpacity
                onPress={() => {
                  if (i < step) { setErrors({}); setStep(i); Haptics.selectionAsync(); }
                }}
                activeOpacity={i < step ? 0.7 : 1}
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: i < step ? colors.primary : i === step ? colors.primary : colors.muted,
                    borderColor: i <= step ? colors.primary : colors.border,
                  }
                ]}
              >
                {i < step ? (
                  <Feather name="check" size={13} color="#fff" />
                ) : (
                  <Text style={[styles.stepNum, { color: i === step ? "#fff" : colors.textLight }]}>{i + 1}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { if (i < step) { setErrors({}); setStep(i); Haptics.selectionAsync(); } }} activeOpacity={i < step ? 0.7 : 1}>
                <Text style={[styles.stepLabel, { color: i <= step ? colors.primary : colors.textLight, textDecorationLine: i < step ? "underline" : "none" }]}>{label}</Text>
              </TouchableOpacity>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: i < step ? colors.primary : colors.border }]} />
              )}
            </View>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ─── STEP 0: Addresses ─── */}
          {step === 0 && (
            <>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>📍 من أين إلى أين؟</Text>

              {/* Pickup */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>موقع الاستلام</Text>
                <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: errors.pickup ? colors.destructive : colors.border }]}>
                  <View style={[styles.inputIcon, { backgroundColor: colors.primary + "18" }]}>
                    <Feather name="map-pin" size={16} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="مثال: الرمال - شارع الوحدة"
                    placeholderTextColor={colors.textLight}
                    value={pickup}
                    onChangeText={(t) => { setPickup(t); setErrors((e) => ({ ...e, pickup: "" })); }}
                  />
                </View>
                {errors.pickup ? <Text style={[styles.errText, { color: colors.destructive }]}>{errors.pickup}</Text> : null}

                {savedAddresses.length > 0 && (
                  <>
                    <Text style={[styles.savedLabel, { color: colors.textGray }]}>عناوين محفوظة:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                      {savedAddresses.map((a) => (
                        <TouchableOpacity
                          key={a.id}
                          onPress={() => setPickup(a.address)}
                          style={[styles.addrChip, { backgroundColor: colors.primaryContainer, borderColor: colors.primary + "30" }]}
                        >
                          <Feather name={a.icon} size={12} color={colors.primary} />
                          <Text style={[styles.addrChipText, { color: colors.primary }]}>{a.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}
              </View>

              {/* Swap */}
              <TouchableOpacity
                style={[styles.swapBtn, { backgroundColor: colors.primaryContainer }]}
                onPress={() => { const t = pickup; setPickup(delivery); setDelivery(t); Haptics.selectionAsync(); }}
              >
                <Feather name="repeat" size={18} color={colors.primary} />
                <Text style={[styles.swapText, { color: colors.primary }]}>تبديل</Text>
              </TouchableOpacity>

              {/* Delivery */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>موقع التسليم</Text>
                <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: errors.delivery ? colors.destructive : colors.border }]}>
                  <View style={[styles.inputIcon, { backgroundColor: colors.secondary + "18" }]}>
                    <Feather name="flag" size={16} color={colors.secondary} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="مثال: الزيتون - دوار أبو حصيرة"
                    placeholderTextColor={colors.textLight}
                    value={delivery}
                    onChangeText={(t) => { setDelivery(t); setErrors((e) => ({ ...e, delivery: "" })); }}
                  />
                </View>
                {errors.delivery ? <Text style={[styles.errText, { color: colors.destructive }]}>{errors.delivery}</Text> : null}

                {savedAddresses.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {savedAddresses.map((a) => (
                      <TouchableOpacity
                        key={a.id}
                        onPress={() => setDelivery(a.address)}
                        style={[styles.addrChip, { backgroundColor: colors.muted, borderColor: colors.border }]}
                      >
                        <Feather name={a.icon} size={12} color={colors.textGray} />
                        <Text style={[styles.addrChipText, { color: colors.textGray }]}>{a.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </>
          )}

          {/* ─── STEP 1: Package description ─── */}
{/* ─── STEP 1: Package description ─── */}
{step === 1 && (
  <>
    <Text style={[styles.stepTitle, { color: colors.foreground }]}>📦 ماذا تريد توصيله؟</Text>
    
    {/* خيارات سريعة */}
    <View style={styles.quickItemsSection}>
      <Text style={[styles.quickItemsTitle, { color: colors.textGray }]}>اختر نوع الطرد (اختياري):</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickItemsScroll}>
        <View style={styles.quickItemsWrap}>
          {QUICK_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.quickItemChip,
                {
                  backgroundColor: description === item.description ? colors.primary + "18" : colors.card,
                  borderColor: description === item.description ? colors.primary : colors.border,
                  borderWidth: description === item.description ? 2 : 1,
                }
              ]}
              onPress={() => {
                setDescription(item.description);
                Haptics.selectionAsync();
              }}
            >
              <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              <Text style={[styles.quickItemLabel, { color: colors.foreground }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>

    {/* وصف تفصيلي (اختياري) */}
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
        وصف تفصيلي <Text style={{ fontSize: 12, fontWeight: "normal" }}>(اختياري)</Text>
      </Text>
      <View style={[
        styles.textAreaBox,
        { backgroundColor: colors.card, borderColor: errors.description ? colors.destructive : colors.border }
      ]}>
        <TextInput
          style={[styles.textArea, { color: colors.foreground }]}
          placeholder="مثال: كرتون ملابس - 3 قطع متوسطة الحجم، محتاج عناية..."
          placeholderTextColor={colors.textLight}
          value={description}
          onChangeText={(t) => { setDescription(t); setErrors((e) => ({ ...e, description: "" })); }}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
      {errors.description ? <Text style={[styles.errText, { color: colors.destructive }]}>{errors.description}</Text> : null}
    </View>

    {/* نصائح */}
    <Text style={[styles.hintTitle, { color: colors.textGray }]}>نصائح للوصف الدقيق:</Text>
    {["اذكر نوع وحجم الطرد", "أشر إذا كان قابلًا للكسر", "اذكر الوزن التقريبي إن كان ثقيلاً"].map((tip, i) => (
      <View key={i} style={styles.tipRow}>
        <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
        <Text style={[styles.tipText, { color: colors.textGray }]}>{tip}</Text>
      </View>
    ))}

    {/* Preview */}
    {(pickup || delivery) && (
      <View style={[styles.routePreview, { backgroundColor: colors.muted }]}>
        <View style={styles.routePreviewRow}>
          <Feather name="map-pin" size={13} color={colors.primary} />
          <Text style={[styles.routePreviewText, { color: colors.textGray }]} numberOfLines={1}>{pickup}</Text>
        </View>
        <View style={styles.routePreviewRow}>
          <Feather name="flag" size={13} color={colors.secondary} />
          <Text style={[styles.routePreviewText, { color: colors.textGray }]} numberOfLines={1}>{delivery}</Text>
        </View>
      </View>
    )}
  </>
)
          }

          {/* ─── STEP 2: Vehicle type & Payment ─── */}
          {step === 2 && (
            <>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>🚗 اختر نوع المركبة</Text>
              <Text style={[styles.stepSub, { color: colors.textGray }]}>
                سيتم إرسال طلبك للسائقين الذين يمتلكون هذه المركبة
              </Text>

              <View style={styles.vehicleList}>
                {VEHICLES.map((v) => {
                  const selected = vehicleType === v.type;
                  return (
                    <TouchableOpacity
                      key={v.type}
                      style={[
                        styles.vehicleCard,
                        {
                          backgroundColor: selected ? v.color + "12" : colors.card,
                          borderColor: selected ? v.color : colors.border,
                          borderWidth: selected ? 2 : 1,
                        },
                      ]}
                      onPress={() => { setVehicleType(v.type); Haptics.selectionAsync(); }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.vehicleEmoji}>{v.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.vehicleLabel, { color: selected ? v.color : colors.foreground }]}>{v.label}</Text>
                        <Text style={[styles.vehicleSub, { color: colors.textGray }]}>{v.sub}</Text>
                        <Text style={[styles.vehicleEx, { color: colors.textLight }]}>{v.examples}</Text>
                      </View>
                      <View style={[
                        styles.radioOuter,
                        { borderColor: selected ? v.color : colors.border }
                      ]}>
                        {selected && <View style={[styles.radioInner, { backgroundColor: v.color }]} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Payment method section */}
              <Text style={[styles.paymentSectionTitle, { color: colors.foreground, marginTop: 16 }]}>
                💳 طريقة الدفع <Text style={{ fontSize: 12, fontWeight: "normal" }}>(لإعلام السائق)</Text>
              </Text>

              {/* Cash option */}
              <TouchableOpacity
                style={[
                  styles.payCard,
                  {
                    backgroundColor: paymentMethod === "cash" ? "#28A74510" : colors.card,
                    borderColor: paymentMethod === "cash" ? "#28A745" : colors.border,
                    borderWidth: paymentMethod === "cash" ? 2 : 1,
                  },
                ]}
                onPress={() => { setPaymentMethod("cash"); Haptics.selectionAsync(); }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 26 }}>💵</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.payTitle, { color: paymentMethod === "cash" ? "#28A745" : colors.foreground }]}>كاش (نقداً)</Text>
                  <Text style={[styles.paySub, { color: colors.textGray }]}>تدفع للسائق نقداً عند استلام الطرد</Text>
                </View>
                <View style={[styles.radioOuter, { borderColor: paymentMethod === "cash" ? "#28A745" : colors.border }]}>
                  {paymentMethod === "cash" && <View style={[styles.radioInner, { backgroundColor: "#28A745" }]} />}
                </View>
              </TouchableOpacity>

              {/* Electronic option */}
              <TouchableOpacity
                style={[
                  styles.payCard,
                  {
                    backgroundColor: paymentMethod === "electronic" ? "#1E88E510" : colors.card,
                    borderColor: paymentMethod === "electronic" ? "#1E88E5" : colors.border,
                    borderWidth: paymentMethod === "electronic" ? 2 : 1,
                  },
                ]}
                onPress={() => { setPaymentMethod("electronic"); Haptics.selectionAsync(); }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 26 }}>💳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.payTitle, { color: paymentMethod === "electronic" ? "#1E88E5" : colors.foreground }]}>دفع إلكتروني</Text>
                  <Text style={[styles.paySub, { color: colors.textGray }]}>
                    دفع عبر بطاقة أو تحويل بنكي (خارج التطبيق)
                  </Text>
                </View>
                <View style={[styles.radioOuter, { borderColor: paymentMethod === "electronic" ? "#1E88E5" : colors.border }]}>
                  {paymentMethod === "electronic" && <View style={[styles.radioInner, { backgroundColor: "#1E88E5" }]} />}
                </View>
              </TouchableOpacity>

              {/* Summary card */}
              <View style={[styles.summaryCard, { backgroundColor: colors.muted }]}>
                <Text style={[styles.summaryTitle, { color: colors.foreground }]}>ملخص الطلب</Text>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryKey, { color: colors.textGray }]}>الاستلام</Text>
                  <Text style={[styles.summaryVal, { color: colors.foreground }]} numberOfLines={1}>{pickup}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryKey, { color: colors.textGray }]}>التسليم</Text>
                  <Text style={[styles.summaryVal, { color: colors.foreground }]} numberOfLines={1}>{delivery}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryKey, { color: colors.textGray }]}>الطرد</Text>
                  <Text style={[styles.summaryVal, { color: colors.foreground }]} numberOfLines={1}>{description}</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryKey, { color: colors.textGray }]}>طريقة الدفع</Text>
                  <Text style={[styles.summaryVal, { color: paymentMethod === "cash" ? "#28A745" : "#1E88E5", fontWeight: "700" }]}>
                    {paymentMethod === "cash" ? "💵 كاش (نقداً)" : "💳 دفع إلكتروني"}
                  </Text>
                </View>
              </View>
            </>
          )}

        </ScrollView>

        {/* Bottom action */}
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 20 : insets.bottom + 8 }]}>
          {step < 2 ? (
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
              onPress={next}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>التالي</Text>
              <Feather name="chevron-left" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: loading ? colors.muted : colors.secondary }]}
              onPress={submit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <Text style={styles.nextBtnText}>جاري الإرسال...</Text>
              ) : (
                <>
                  <Feather name="send" size={18} color="#fff" />
                  <Text style={styles.nextBtnText}>إرسال الطلب للسائقين</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  backBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", textAlign: "center" },
  stepBar: { flexDirection: "row", paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, justifyContent: "space-between", alignItems: "center" },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  stepNum: { fontSize: 13, fontWeight: "700" },
  stepLabel: { fontSize: 12, fontWeight: "600" },
  stepLine: { width: 24, height: 2, borderRadius: 1, marginHorizontal: 4 },
  stepTitle: { fontSize: 19, fontWeight: "700" },
  stepSub: { fontSize: 13, marginTop: -8 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: "700" },
  inputBox: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1.5, overflow: "hidden" },
  inputIcon: { width: 44, height: 50, justifyContent: "center", alignItems: "center" },
  input: { flex: 1, fontSize: 14, paddingHorizontal: 12, height: 50 },
  savedLabel: { fontSize: 12, fontWeight: "500" },
  addrChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginLeft: 8 },
  addrChipText: { fontSize: 12, fontWeight: "600" },
  swapBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, alignSelf: "center", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  swapText: { fontSize: 13, fontWeight: "600" },
  errText: { fontSize: 12, marginTop: 2 },
  textAreaBox: { borderRadius: 12, borderWidth: 1.5, padding: 14 },
  textArea: { fontSize: 14, minHeight: 100 },
  hintTitle: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3 },
  tipText: { fontSize: 13 },
  routePreview: { borderRadius: 12, padding: 12, gap: 8 },
  routePreviewRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  routePreviewText: { fontSize: 13, flex: 1 },
  vehicleList: { gap: 12 },
  paymentSectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  payCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, marginBottom: 8 },
  payTitle: { fontSize: 15, fontWeight: "700" },
  paySub: { fontSize: 12, marginTop: 2 },
  vehicleCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, marginBottom: 8 },
  vehicleEmoji: { fontSize: 34 },
  vehicleLabel: { fontSize: 17, fontWeight: "700" },
  vehicleSub: { fontSize: 12, marginTop: 2 },
  vehicleEx: { fontSize: 11, marginTop: 2 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  radioInner: { width: 11, height: 11, borderRadius: 5.5 },
  summaryCard: { borderRadius: 14, padding: 16, gap: 10, marginTop: 16 },
  summaryTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  summaryKey: { fontSize: 13 },
  summaryVal: { fontSize: 13, fontWeight: "600", flex: 1, textAlign: "right" },
  summaryDivider: { height: 1, marginVertical: 6 },
  bottomBar: { padding: 16, borderTopWidth: 1 },
  nextBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    quickItemsSection: {
    gap: 8,
    marginBottom: 8,
  },
  quickItemsTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  quickItemsScroll: {
    flexGrow: 0,
  },
  quickItemsWrap: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
  },
  quickItemChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
  },
  quickItemLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});