import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const QUICK_REPLIES = [
  "كم الوقت المتبقي؟",
  "أين أنت الآن؟",
  "تمام، في انتظارك",
  "شكراً 🙏",
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default function ChatScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { user } = useAuth();
  const { getOrderById, sendMessage, markMessagesRead } = useOrders();
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const order = getOrderById(orderId);
  const messages = order?.messages ?? [];
  const driverName = order?.selectedOffer?.driverName ?? "السائق";
  const driverInitial = driverName.charAt(0);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // Mark messages read when screen opens and when new messages arrive
  useEffect(() => {
    if (user && orderId) {
      markMessagesRead(orderId, user.id);
    }
  }, [orderId, user?.id, messages.length]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  // Show typing indicator when customer sends, hide when driver replies
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.senderRole === "customer") {
      setIsTyping(true);
      typingTimer.current = setTimeout(() => setIsTyping(false), 8000);
    } else {
      setIsTyping(false);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    }
    return () => { if (typingTimer.current) clearTimeout(typingTimer.current); };
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(orderId, user.id, "customer", trimmed);
    setText("");
  };

  const handleQuickReply = (reply: string) => {
    if (!user) return;
    Haptics.selectionAsync();
    sendMessage(orderId, user.id, "customer", reply);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: topPad > 20 ? 0 : 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.driverAvatar, { backgroundColor: "#28A74520" }]}>
          <Text style={[styles.driverInitial, { color: "#28A745" }]}>{driverInitial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.driverName, { color: colors.foreground }]}>{driverName}</Text>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: "#28A745" }]} />
            <Text style={[styles.onlineLabel, { color: colors.textGray }]}>متصل • سائق نشط</Text>
          </View>
        </View>
        <View style={[styles.orderBadge, { backgroundColor: colors.primaryContainer }]}>
          <Text style={[styles.orderBadgeText, { color: colors.primary }]}>#{orderId?.slice(-6)}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesList,
            { paddingBottom: Platform.OS === "web" ? 12 : 8 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <View style={[styles.emptyChatIcon, { backgroundColor: colors.muted }]}>
                <Feather name="message-circle" size={32} color={colors.textLight} />
              </View>
              <Text style={[styles.emptyChatTitle, { color: colors.foreground }]}>ابدأ المحادثة</Text>
              <Text style={[styles.emptyChatSub, { color: colors.textGray }]}>
                تواصل مع السائق مباشرة حول طلبك
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isCustomer = item.senderRole === "customer";
            const prevItem = index > 0 ? messages[index - 1] : null;
            const showAvatar = !isCustomer && prevItem?.senderRole !== "driver";
            return (
              <View style={[styles.msgRow, isCustomer ? styles.msgRowCustomer : styles.msgRowDriver]}>
                {!isCustomer && (
                  <View style={[styles.msgAvatar, showAvatar ? { backgroundColor: "#28A74520" } : styles.msgAvatarHidden]}>
                    {showAvatar && <Text style={[styles.msgAvatarText, { color: "#28A745" }]}>{driverInitial}</Text>}
                  </View>
                )}
                <View style={[
                  styles.bubble,
                  isCustomer
                    ? [styles.bubbleCustomer, { backgroundColor: colors.primary }]
                    : [styles.bubbleDriver, { backgroundColor: colors.card, borderColor: colors.border }],
                ]}>
                  <Text style={[styles.bubbleText, { color: isCustomer ? "#fff" : colors.foreground }]}>
                    {item.text}
                  </Text>
                  <View style={[styles.bubbleMeta, isCustomer ? styles.bubbleMetaCustomer : styles.bubbleMetaDriver]}>
                    <Text style={[styles.bubbleTime, { color: isCustomer ? "rgba(255,255,255,0.6)" : colors.textLight }]}>
                      {formatTime(item.timestamp)}
                    </Text>
                    {isCustomer && (
                      <Feather name={item.isRead ? "check-circle" : "check"} size={11} color="rgba(255,255,255,0.6)" />
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            isTyping ? (
              <View style={[styles.msgRow, styles.msgRowDriver]}>
                <View style={[styles.msgAvatar, { backgroundColor: "#28A74520" }]}>
                  <Text style={[styles.msgAvatarText, { color: "#28A745" }]}>{driverInitial}</Text>
                </View>
                <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TypingDots colors={colors} />
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick replies */}
        {messages.length === 0 && (
          <View style={styles.quickRepliesRow}>
            {QUICK_REPLIES.map((reply) => (
              <TouchableOpacity
                key={reply}
                style={[styles.quickReplyChip, { backgroundColor: colors.primaryContainer, borderColor: colors.primary + "30" }]}
                onPress={() => handleQuickReply(reply)}
                activeOpacity={0.75}
              >
                <Text style={[styles.quickReplyText, { color: colors.primary }]}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 16 : insets.bottom + 8 }]}>
          <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="اكتب رسالتك..."
              placeholderTextColor={colors.textLight}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
            onPress={handleSend}
            disabled={!text.trim()}
            activeOpacity={0.8}
          >
            <Feather name="send" size={18} color={text.trim() ? "#fff" : colors.textLight} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TypingDots({ colors }: { colors: ReturnType<typeof import("@/hooks/useColors").useColors> }) {
  const [dots, setDots] = React.useState(1);
  React.useEffect(() => {
    const t = setInterval(() => setDots((d) => (d % 3) + 1), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[styles.typingDot, { backgroundColor: i <= dots ? colors.textGray : colors.border }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  backBtn: { padding: 4 },
  driverAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  driverInitial: { fontSize: 17, fontWeight: "700" },
  driverName: { fontSize: 15, fontWeight: "700" },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineLabel: { fontSize: 11 },
  orderBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  orderBadgeText: { fontSize: 11, fontWeight: "700" },
  messagesList: { padding: 14, gap: 6, flexGrow: 1 },
  emptyChat: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 10 },
  emptyChatIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  emptyChatTitle: { fontSize: 16, fontWeight: "700" },
  emptyChatSub: { fontSize: 13, textAlign: "center" },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginVertical: 2 },
  msgRowCustomer: { justifyContent: "flex-start", flexDirection: "row-reverse" },
  msgRowDriver: { justifyContent: "flex-start" },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  msgAvatarHidden: { backgroundColor: "transparent" },
  msgAvatarText: { fontSize: 13, fontWeight: "700" },
  bubble: { maxWidth: "72%", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  bubbleCustomer: { borderBottomRightRadius: 4 },
  bubbleDriver: { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
  bubbleMetaCustomer: { justifyContent: "flex-end" },
  bubbleMetaDriver: { justifyContent: "flex-start" },
  bubbleTime: { fontSize: 10 },
  typingBubble: { borderRadius: 16, borderBottomLeftRadius: 4, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  typingDot: { width: 6, height: 6, borderRadius: 3 },
  quickRepliesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 14, paddingBottom: 8 },
  quickReplyChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  quickReplyText: { fontSize: 12, fontWeight: "600" },
  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 14, paddingTop: 10, gap: 8, borderTopWidth: 1 },
  inputWrap: { flex: 1, borderRadius: 22, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 8, minHeight: 44, maxHeight: 110, justifyContent: "center" },
  input: { fontSize: 14, lineHeight: 20 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
});
