// app/support.tsx
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
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

// الأسئلة الشائعة
const FAQS = [
  { id: "1", question: "كيف يمكنني إنشاء طلب توصيل؟", answer: "اضغط على زر 'طلب جديد' في الصفحة الرئيسية، ثم أدخل بيانات الاستلام والتسليم ووصف الطرد." },
  { id: "2", question: "كيف يمكنني تتبع طلبي؟", answer: "بعد اختيار السائق، ستظهر لك شاشة التتبع التي تظهر موقع السائق لحظة بلحظة." },
  { id: "3", question: "ماذا أفعل إذا لم يظهر لي سائق؟", answer: "انتظر دقيقة ثم حاول مرة أخرى، أو تواصل مع الدعم الفني للمساعدة." },
  { id: "4", question: "كيف يتم الدفع؟", answer: "الدفع يتم نقداً عند الاستلام، أو إلكترونياً حسب اختيارك." },
  { id: "5", question: "كيف أضيف سائقاً إلى مفضلاتي؟", answer: "بعد إتمام الطلب، ستظهر شاشة التقييم حيث يمكنك إضافة السائق إلى مفضلاتك." },
];

export default function SupportScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const handleCall = () => {
    Linking.openURL("tel:+97059900000");
  };

  const handleWhatsApp = () => {
    Linking.openURL("https://wa.me/97059900000?text=مرحباً، أحتاج مساعدة في تطبيق سريع");
  };

  const handleEmail = () => {
    Linking.openURL("mailto:support@saree3.app?subject=استفسار من المستخدم");
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert("تنبيه", "الرجاء كتابة رسالتك قبل الإرسال");
      return;
    }

    setSending(true);
    // محاكاة إرسال الرسالة
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    setMessage("");
    Alert.alert("✅ تم الإرسال", "تم استلام رسالتك، سنرد عليك في أقرب وقت");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
    Haptics.selectionAsync();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#FF6584", paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الدعم الفني</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Contact Options */}
        <View style={styles.contactSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📞 تواصل معنا</Text>
          <View style={styles.contactGrid}>
            <TouchableOpacity
              style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleCall}
            >
              <View style={[styles.contactIcon, { backgroundColor: "#28A74515" }]}>
                <Feather name="phone" size={24} color="#28A745" />
              </View>
              <Text style={[styles.contactLabel, { color: colors.foreground }]}>اتصال</Text>
              <Text style={[styles.contactValue, { color: colors.textGray }]}>0599 000 000</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleWhatsApp}
            >
              <View style={[styles.contactIcon, { backgroundColor: "#25D36615" }]}>
                <Feather name="message-circle" size={24} color="#25D366" />
              </View>
              <Text style={[styles.contactLabel, { color: colors.foreground }]}>واتساب</Text>
              <Text style={[styles.contactValue, { color: colors.textGray }]}>دردشة مباشرة</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleEmail}
            >
              <View style={[styles.contactIcon, { backgroundColor: "#1E88E515" }]}>
                <Feather name="mail" size={24} color="#1E88E5" />
              </View>
              <Text style={[styles.contactLabel, { color: colors.foreground }]}>البريد الإلكتروني</Text>
              <Text style={[styles.contactValue, { color: colors.textGray }]}>support@saree3.app</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>❓ الأسئلة الشائعة</Text>
          {FAQS.map((faq) => (
            <View key={faq.id} style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => toggleFaq(faq.id)}
                activeOpacity={0.7}
              >
                <Feather name="help-circle" size={18} color={colors.primary} />
                <Text style={[styles.faqQuestion, { color: colors.foreground, flex: 1 }]}>{faq.question}</Text>
                <Feather name={expandedFaq === faq.id ? "chevron-up" : "chevron-down"} size={18} color={colors.textGray} />
              </TouchableOpacity>
              {expandedFaq === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={[styles.faqAnswerText, { color: colors.textGray }]}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Form */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>✉️ أرسل رسالة</Text>
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.messageInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="اكتب رسالتك هنا..."
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: "#FF6584", opacity: sending ? 0.7 : 1 }]}
              onPress={handleSendMessage}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="send" size={18} color="#fff" />
                  <Text style={styles.sendBtnText}>إرسال الرسالة</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.textLight }]}>تطبيق سريع - الإصدار 2.0.0</Text>
          <Text style={[styles.appSupport, { color: colors.textLight }]}>الدعم متاح 24/7</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  
  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  
  // Container
  container: { padding: 16, paddingBottom: 40 },
  
  // Contact Section
  contactSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  contactGrid: { flexDirection: "row", gap: 12 },
  contactCard: { flex: 1, alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
  contactIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  contactLabel: { fontSize: 13, fontWeight: "600" },
  contactValue: { fontSize: 11, textAlign: "center" },
  
  // FAQ Section
  faqSection: { marginBottom: 24 },
  faqCard: { borderRadius: 12, borderWidth: 1, marginBottom: 8, overflow: "hidden" },
  faqHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  faqQuestion: { fontSize: 13, fontWeight: "600" },
  faqAnswer: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: "#E5E5E5" },
  faqAnswerText: { fontSize: 12, lineHeight: 18 },
  
  // Form Section
  formSection: { marginBottom: 24 },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  messageInput: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 14, minHeight: 100 },
  sendBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12 },
  sendBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  
  // App Info
  appInfo: { alignItems: "center", paddingTop: 16, gap: 4 },
  appVersion: { fontSize: 11 },
  appSupport: { fontSize: 10 },
});