// app/(support)/ticket-details.tsx
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
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

// واجهة التذكرة
interface Ticket {
  id: string;
  user: string;
  userPhone: string;
  userRole: string;
  title: string;
  status: "open" | "in_progress" | "closed";
  priority: "high" | "medium" | "low";
  date: string;
  message: string;
  replies?: Reply[];
}

interface Reply {
  id: string;
  sender: string;
  senderRole: "support" | "user";
  message: string;
  date: string;
}

// بيانات تجريبية للتذكرة
const MOCK_TICKET: Ticket = {
  id: "TKT-12345",
  user: "أحمد محمد",
  userPhone: "0591234567",
  userRole: "عميل",
  title: "مشكلة في تسجيل الدخول",
  status: "open",
  priority: "high",
  date: "2024-05-24 10:30 ص",
  message: "لا أستطيع تسجيل الدخول إلى التطبيق، يظهر لي خطأ 'بيانات غير صحيحة' مع أنني متأكد من كلمة المرور. أرجو المساعدة في أقرب وقت.",
  replies: [
    {
      id: "1",
      sender: "دعم فني - سريع",
      senderRole: "support",
      message: "عذراً على الإزعاج، يرجى محاولة إعادة تعيين كلمة المرور من خلال الضغط على 'نسيت كلمة المرور' في صفحة تسجيل الدخول. إذا استمرت المشكلة، أرسل لنا رقم هاتفك لتتم إعادة تعيينها يدوياً.",
      date: "2024-05-24 11:15 ص",
    },
    {
      id: "2",
      sender: "أحمد محمد",
      senderRole: "user",
      message: "جربت إعادة التعيين ولكن لم يصلني أي رابط على البريد الإلكتروني. الرجاء المساعدة.",
      date: "2024-05-24 12:00 م",
    },
  ],
};

export default function TicketDetailsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [ticket, setTicket] = useState<Ticket>(MOCK_TICKET);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "open":
        return { label: "مفتوحة", color: "#DC3545", bg: "#DC354515", icon: "alert-circle" };
      case "in_progress":
        return { label: "قيد المعالجة", color: "#FFA63D", bg: "#FFA63D15", icon: "clock" };
      case "closed":
        return { label: "مغلقة", color: "#28A745", bg: "#28A74515", icon: "check-circle" };
      default:
        return { label: status, color: "#6C757D", bg: "#6C757D15", icon: "circle" };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "high":
        return { label: "عالية", color: "#DC3545", bg: "#DC354515", icon: "alert-triangle" };
      case "medium":
        return { label: "متوسطة", color: "#FFA63D", bg: "#FFA63D15", icon: "alert-circle" };
      case "low":
        return { label: "منخفضة", color: "#28A745", bg: "#28A74515", icon: "info" };
      default:
        return { label: priority, color: "#6C757D", bg: "#6C757D15", icon: "circle" };
    }
  };

  const handleStatusChange = async (newStatus: "open" | "in_progress" | "closed") => {
    setUpdatingStatus(true);
    Haptics.selectionAsync();
    await new Promise((r) => setTimeout(r, 500));
    setTicket({ ...ticket, status: newStatus });
    setUpdatingStatus(false);
    Alert.alert("✅ تم التحديث", `تم تغيير حالة التذكرة إلى ${getStatusConfig(newStatus).label}`);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      Alert.alert("تنبيه", "الرجاء كتابة ردك قبل الإرسال");
      return;
    }

    setSending(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise((r) => setTimeout(r, 800));

    const newReply: Reply = {
      id: Date.now().toString(),
      sender: "دعم فني - سريع",
      senderRole: "support",
      message: replyText.trim(),
      date: new Date().toLocaleString("ar-EG"),
    };

    setTicket({
      ...ticket,
      replies: [...(ticket.replies || []), newReply],
    });
    setReplyText("");
    setSending(false);
    Alert.alert("✅ تم الإرسال", "تم إرسال ردك بنجاح");
  };

  const handleContactUser = () => {
    Alert.alert("📞 اتصل بالمستخدم", `رقم الهاتف: ${ticket.userPhone}`, [
      { text: "إلغاء", style: "cancel" },
      { text: "اتصال", onPress: () => Linking.openURL(`tel:${ticket.userPhone}`) },
    ]);
  };

  const statusConfig = getStatusConfig(ticket.status);
  const priorityConfig = getPriorityConfig(ticket.priority);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#00ACC1", paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل التذكرة</Text>
        <TouchableOpacity onPress={handleContactUser} style={styles.contactBtn}>
          <Feather name="phone" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Ticket Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.ticketId, { color: colors.primary }]}>#{ticket.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Feather name={statusConfig.icon as any} size={12} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
          </View>

          <Text style={[styles.ticketTitle, { color: colors.foreground }]}>{ticket.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="user" size={14} color={colors.textGray} />
              <Text style={[styles.metaText, { color: colors.textGray }]}>{ticket.user}</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="tag" size={14} color={colors.textGray} />
              <Text style={[styles.metaText, { color: colors.textGray }]}>{ticket.userRole}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="calendar" size={14} color={colors.textGray} />
              <Text style={[styles.metaText, { color: colors.textGray }]}>{ticket.date}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.bg }]}>
              <Feather name={priorityConfig.icon as any} size={10} color={priorityConfig.color} />
              <Text style={[styles.priorityText, { color: priorityConfig.color }]}>أولوية {priorityConfig.label}</Text>
            </View>
          </View>

          <View style={[styles.messageBox, { backgroundColor: colors.muted }]}>
            <Text style={[styles.messageText, { color: colors.textGray }]}>{ticket.message}</Text>
          </View>
        </View>

        {/* Status Update Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>تحديث الحالة</Text>
          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={[
                styles.statusBtn,
                {
                  backgroundColor: ticket.status === "open" ? "#DC3545" : colors.muted,
                  borderColor: ticket.status === "open" ? "#DC3545" : colors.border,
                },
              ]}
              onPress={() => handleStatusChange("open")}
              disabled={updatingStatus}
            >
              <Feather name="alert-circle" size={16} color={ticket.status === "open" ? "#fff" : colors.textGray} />
              <Text style={[styles.statusBtnText, { color: ticket.status === "open" ? "#fff" : colors.textGray }]}>مفتوحة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusBtn,
                {
                  backgroundColor: ticket.status === "in_progress" ? "#FFA63D" : colors.muted,
                  borderColor: ticket.status === "in_progress" ? "#FFA63D" : colors.border,
                },
              ]}
              onPress={() => handleStatusChange("in_progress")}
              disabled={updatingStatus}
            >
              <Feather name="clock" size={16} color={ticket.status === "in_progress" ? "#fff" : colors.textGray} />
              <Text style={[styles.statusBtnText, { color: ticket.status === "in_progress" ? "#fff" : colors.textGray }]}>قيد المعالجة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusBtn,
                {
                  backgroundColor: ticket.status === "closed" ? "#28A745" : colors.muted,
                  borderColor: ticket.status === "closed" ? "#28A745" : colors.border,
                },
              ]}
              onPress={() => handleStatusChange("closed")}
              disabled={updatingStatus}
            >
              <Feather name="check-circle" size={16} color={ticket.status === "closed" ? "#fff" : colors.textGray} />
              <Text style={[styles.statusBtnText, { color: ticket.status === "closed" ? "#fff" : colors.textGray }]}>مغلقة</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Replies Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>💬 الردود</Text>
          {ticket.replies && ticket.replies.length > 0 ? (
            ticket.replies.map((reply) => (
              <View
                key={reply.id}
                style={[
                  styles.replyCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    alignSelf: reply.senderRole === "support" ? "flex-start" : "flex-end",
                  },
                ]}
              >
                <View style={styles.replyHeader}>
                  <View style={[styles.replyAvatar, { backgroundColor: reply.senderRole === "support" ? "#00ACC115" : colors.primary + "15" }]}>
                    <Feather name={reply.senderRole === "support" ? "headphones" : "user"} size={14} color={reply.senderRole === "support" ? "#00ACC1" : colors.primary} />
                  </View>
                  <Text style={[styles.replySender, { color: reply.senderRole === "support" ? "#00ACC1" : colors.primary }]}>
                    {reply.sender}
                  </Text>
                  <Text style={[styles.replyDate, { color: colors.textLight }]}>{reply.date}</Text>
                </View>
                <Text style={[styles.replyMessage, { color: colors.textGray }]}>{reply.message}</Text>
              </View>
            ))
          ) : (
            <View style={[styles.noReplies, { backgroundColor: colors.muted }]}>
              <Feather name="message-circle" size={32} color={colors.textLight} />
              <Text style={[styles.noRepliesText, { color: colors.textGray }]}>لا توجد ردود بعد</Text>
            </View>
          )}
        </View>

        {/* Reply Form */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>✏️ إضافة رد</Text>
          <View style={[styles.replyForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.replyInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="اكتب ردك هنا..."
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={replyText}
              onChangeText={setReplyText}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: "#00ACC1", opacity: sending ? 0.7 : 1 }]}
              onPress={handleSendReply}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="send" size={18} color="#fff" />
                  <Text style={styles.sendBtnText}>إرسال الرد</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
  contactBtn: { padding: 8 },
  
  // Container
  container: { padding: 16, paddingBottom: 40 },
  
  // Info Card
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, marginBottom: 20 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ticketId: { fontSize: 14, fontWeight: "700" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "600" },
  ticketTitle: { fontSize: 16, fontWeight: "700" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12 },
  priorityBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  priorityText: { fontSize: 10, fontWeight: "600" },
  messageBox: { borderRadius: 12, padding: 14, marginTop: 4 },
  messageText: { fontSize: 13, lineHeight: 20 },
  
  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  
  // Status Buttons
  statusButtons: { flexDirection: "row", gap: 10 },
  statusBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  statusBtnText: { fontSize: 12, fontWeight: "600" },
  
  // Replies
  replyCard: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10, maxWidth: "85%" },
  replyHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  replyAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  replySender: { fontSize: 12, fontWeight: "600", flex: 1 },
  replyDate: { fontSize: 10 },
  replyMessage: { fontSize: 13, lineHeight: 18 },
  noReplies: { alignItems: "center", justifyContent: "center", paddingVertical: 30, borderRadius: 14, gap: 8 },
  noRepliesText: { fontSize: 13 },
  
  // Reply Form
  replyForm: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  replyInput: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 14, minHeight: 100 },
  sendBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12 },
  sendBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});