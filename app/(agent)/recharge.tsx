// app/(agent)/recharge.tsx
import { useAgent } from "@/context/AgentContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

export default function AgentRechargeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { rechargeBalance, getBalance } = useAgent();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [amount, setAmount] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const balance = getBalance();

  const ordersCount = parseInt(amount) || 0;
  const fee = ordersCount * 0.2;
  const paidAmount = ordersCount - fee;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("تنبيه", "نحتاج إلى إذن الوصول إلى المعرض");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (ordersCount < 10) {
      Alert.alert("تنبيه", "الرجاء إدخال عدد طلبات صالح (10 طلبات على الأقل)");
      return;
    }
    
    if (!imageUri) {
      Alert.alert("تنبيه", "الرجاء رفع صورة إشعار الدفع");
      return;
    }
    
    setLoading(true);
    try {
      const request = await rechargeBalance(ordersCount, imageUri);
      Alert.alert(
        "✅ تم إرسال الطلب",
        `تم إرسال طلب شحن ${ordersCount} طلب.\nالمبلغ المدفوع: ${paidAmount} شيكل\nسيتم مراجعته من قبل الإدارة.`,
        [{ text: "حسناً", onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert("❌ خطأ", "حدث خطأ أثناء إرسال الطلب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: AGENT_COLOR, paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>طلب شحن رصيد</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* الرصيد الحالي */}
        <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.balanceLabel, { color: colors.textGray }]}>الرصيد الحالي</Text>
          <Text style={[styles.balanceValue, { color: AGENT_COLOR }]}>{balance.availableOrders}</Text>
          <Text style={[styles.balanceUnit, { color: colors.textGray }]}>طلبات متاحة للبيع</Text>
        </View>

        {/* تحذير الرصيد المنخفض */}
        {balance.availableOrders <= 10 && balance.availableOrders > 0 && (
          <View style={[styles.warningCard, { backgroundColor: "#FFF8E1", borderColor: "#FFA63D" }]}>
            <Feather name="alert-triangle" size={20} color="#FFA63D" />
            <Text style={styles.warningText}>تبقى لديك {balance.availableOrders} طلب فقط! يرجى شحن الرصيد</Text>
          </View>
        )}

        {balance.availableOrders === 0 && (
          <View style={[styles.warningCard, { backgroundColor: "#FFEBEE", borderColor: "#DC3545" }]}>
            <Feather name="alert-circle" size={20} color="#DC3545" />
            <Text style={[styles.warningText, { color: "#DC3545" }]}>رصيدك من الطلبات نفد! يرجى الشحن فوراً</Text>
          </View>
        )}

        {/* نموذج الطلب */}
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>تفاصيل طلب الشحن</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textGray }]}>عدد الطلبات المطلوب شحنها</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="مثال: 100"
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <Text style={[styles.inputHint, { color: colors.textLight }]}>الحد الأدنى 10 طلبات</Text>
          </View>

          {/* تفاصيل الدفع */}
          {amount && (
            <View style={[styles.paymentDetails, { backgroundColor: colors.background }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textGray }]}>عدد الطلبات المطلوب:</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>{ordersCount} طلب</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textGray }]}>رسوم الخدمة (20%):</Text>
                <Text style={[styles.detailValue, { color: "#DC3545" }]}>{fee} طلب</Text>
              </View>
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={[styles.detailLabel, { color: colors.foreground, fontWeight: "700" }]}>المبلغ المطلوب دفعه:</Text>
                <Text style={[styles.totalValue, { color: AGENT_COLOR, fontWeight: "800" }]}>{paidAmount} شيكل</Text>
              </View>
            </View>
          )}

          {/* رفع الصورة */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textGray }]}>إشعار الدفع</Text>
            {imageUri ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <TouchableOpacity style={styles.reuploadBtn} onPress={pickImage}>
                  <Feather name="refresh-cw" size={14} color={AGENT_COLOR} />
                  <Text style={[styles.reuploadText, { color: AGENT_COLOR }]}>إعادة رفع</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: AGENT_COLOR + "15", borderColor: AGENT_COLOR }]} onPress={pickImage}>
                <Feather name="upload" size={20} color={AGENT_COLOR} />
                <Text style={[styles.uploadText, { color: AGENT_COLOR }]}>رفع صورة إشعار الدفع</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* معلومات مهمة */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={16} color={AGENT_COLOR} />
          <Text style={[styles.infoText, { color: colors.textGray }]}>
            بعد إرسال الطلب، سيتم مراجعته من قبل الإدارة خلال 24 ساعة. سيتم إضافة الرصيد إلى حسابك بعد الموافقة.
          </Text>
        </View>

        {/* زر الإرسال */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: AGENT_COLOR, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="send" size={18} color="#fff" />
              <Text style={styles.submitText}>إرسال طلب الشحن</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  container: { padding: 16, gap: 16, paddingBottom: 40 },
  
  balanceCard: { borderRadius: 14, borderWidth: 1, padding: 16, alignItems: "center" },
  balanceLabel: { fontSize: 12, marginBottom: 4 },
  balanceValue: { fontSize: 36, fontWeight: "800" },
  balanceUnit: { fontSize: 11, marginTop: 4 },
  
  warningCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1 },
  warningText: { fontSize: 13, fontWeight: "500", flex: 1, color: "#856404" },
  
  formCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 16 },
  formTitle: { fontSize: 16, fontWeight: "700" },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 12, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  inputHint: { fontSize: 11 },
  
  paymentDetails: { borderRadius: 10, padding: 12, gap: 8, marginTop: 8 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 13, fontWeight: "600" },
  totalRow: { marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#E5E5E5" },
  totalValue: { fontSize: 16 },
  
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  uploadText: { fontSize: 14, fontWeight: "600" },
  imagePreview: { alignItems: "center", gap: 8 },
  image: { width: "100%", height: 150, borderRadius: 10 },
  reuploadBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  reuploadText: { fontSize: 12, fontWeight: "600" },
  
  infoCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  infoText: { fontSize: 12, flex: 1 },
  
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 8, marginBottom: 40,  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});