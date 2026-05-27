import { useOrders } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useFavorites } from '@/context/FavoritesContext';
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

const QUICK_TAGS = [
  { label: "وصل بسرعة", icon: "⚡" },
  { label: "محترف", icon: "👍" },
  { label: "تواصل جيد", icon: "📞" },
  { label: "حافظ على الطرد", icon: "📦" },
  { label: "ودود", icon: "😊" },
  { label: "دقيق في الموعد", icon: "⏰" },
];

const RATING_LABELS = ["", "سيء", "مقبول", "جيد", "جيد جداً", "ممتاز"];

export default function RateDriverScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { getOrderById, rateOrder } = useOrders();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addFavorite, isFavorite, canAddMore } = useFavorites();
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);

  const order = getOrderById(orderId);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!order || !order.selectedOffer) {
    router.replace("/(customer)/" as any);
    return null;
  }

  const toggleTag = (tag: string) => {
    Haptics.selectionAsync();
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddToFavorites = async () => {
    if (!order?.selectedOffer) return;
    
    setIsAddingFavorite(true);
    const result = await addFavorite({
      id: order.selectedOffer.driverId,
      name: order.selectedOffer.driverName,
      rating: order.selectedOffer.driverRating,
      completedOrdersWithMe: 1,
      phone: order.selectedOffer.driverPhone,
      vehicleType: order.selectedOffer.vehicleType,
    });
    
    setIsAddingFavorite(false);
    
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ تم الإضافة', result.message);
    } else {
      Alert.alert('⚠️ تنبيه', result.message || 'حدث خطأ');
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const fullComment = [comment.trim(), ...selectedTags].filter(Boolean).join(" • ") || "";
    rateOrder(orderId, rating, fullComment);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.successBox}>
          <Text style={{ fontSize: 64 }}>🎉</Text>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>شكراً على تقييمك!</Text>
          <Text style={[styles.successSub, { color: colors.textGray }]}>
            تقييمك يساعد السائقين على تحسين خدمتهم
          </Text>
          <View style={{ flexDirection: "row", gap: 4, marginTop: 8 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Feather key={s} name="star" size={28} color={s <= rating ? "#FFC107" : colors.border} />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(customer)/" as any)}
          >
            <Text style={styles.doneBtnText}>العودة للرئيسية</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const display = hovered || rating;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: topPad > 20 ? 0 : 4 }]}>
        <TouchableOpacity onPress={() => router.replace("/(customer)/" as any)}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>تقييم السائق</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }} showsVerticalScrollIndicator={false}>

        {/* Driver info */}
        <View style={styles.driverBox}>
          <View style={[styles.driverAvatar, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[styles.driverInitial, { color: colors.primary }]}>
              {order.selectedOffer.driverName.charAt(0)}
            </Text>
          </View>
          <Text style={[styles.driverName, { color: colors.foreground }]}>{order.selectedOffer.driverName}</Text>
          <Text style={[styles.driverSub, { color: colors.textGray }]}>
            {order.selectedOffer.totalDeliveries} توصيلة مكتملة
          </Text>
          {order.finalPrice && (
            <View style={[styles.pricePill, { backgroundColor: colors.primaryContainer }]}>
              <Feather name="check-circle" size={14} color={colors.primary} />
              <Text style={[styles.pricePillText, { color: colors.primary }]}>دفعت {order.finalPrice} ₪</Text>
            </View>
          )}
          
          {/* زر إضافة إلى المفضلة */}
          {!isFavorite(order.selectedOffer.driverId) && (
            <TouchableOpacity
              style={[styles.favoriteButton, { backgroundColor: colors.primary + '15' }]}
              onPress={handleAddToFavorites}
              disabled={isAddingFavorite || !canAddMore}
              activeOpacity={0.7}
            >
              <Feather name="star" size={18} color={colors.primary} />
              <Text style={[styles.favoriteButtonText, { color: colors.primary }]}>
                {isAddingFavorite ? 'جاري الإضافة...' : canAddMore ? '⭐ أضف هذا السائق إلى مفضلاتي' : '⚠️ وصلت للحد الأقصى (5 سائقين)'}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* عرض إذا كان السائق مفضلاً بالفعل */}
          {isFavorite(order.selectedOffer.driverId) && (
            <View style={[styles.alreadyFavoriteBadge, { backgroundColor: colors.success + '15' }]}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <Text style={[styles.alreadyFavoriteText, { color: colors.success }]}>
                ✓ هذا السائق في مفضلاتك
              </Text>
            </View>
          )}
        </View>

        {/* Stars */}
        <View style={styles.starsSection}>
          <Text style={[styles.starsLabel, { color: colors.foreground }]}>كيف كانت تجربتك؟</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity
                key={s}
                onPressIn={() => setHovered(s)}
                onPressOut={() => setHovered(0)}
                onPress={() => {
                  setRating(s);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                activeOpacity={0.8}
              >
                <Feather
                  name="star"
                  size={46}
                  color={s <= display ? "#FFC107" : colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>
          {display > 0 && (
            <Text style={[styles.ratingLabel, { color: "#FFC107" }]}>{RATING_LABELS[display]}</Text>
          )}
        </View>

        {/* Quick tags */}
        {rating >= 4 && (
          <View style={styles.tagsSection}>
            <Text style={[styles.tagsTitle, { color: colors.foreground }]}>ما الذي أعجبك؟</Text>
            <View style={styles.tagsWrap}>
              {QUICK_TAGS.map((tag) => {
                const sel = selectedTags.includes(tag.label);
                return (
                  <TouchableOpacity
                    key={tag.label}
                    onPress={() => toggleTag(tag.label)}
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: sel ? colors.primary + "18" : colors.card,
                        borderColor: sel ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.tagIcon}>{tag.icon}</Text>
                    <Text style={[styles.tagLabel, { color: sel ? colors.primary : colors.textGray }]}>{tag.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Comment */}
        <View style={styles.commentSection}>
          <Text style={[styles.commentLabel, { color: colors.foreground }]}>
            تعليق إضافي <Text style={[styles.optional, { color: colors.textLight }]}>(اختياري)</Text>
          </Text>
          <TextInput
            style={[styles.commentInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="شارك تجربتك مع هذا السائق..."
            placeholderTextColor={colors.textLight}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Skip */}
        <TouchableOpacity onPress={() => router.replace("/(customer)/" as any)}>
          <Text style={[styles.skipText, { color: colors.textLight }]}>تخطي التقييم الآن</Text>
        </TouchableOpacity>

      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 16 : insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: rating > 0 ? colors.primary : colors.muted }]}
          onPress={handleSubmit}
          disabled={rating === 0 || loading}
          activeOpacity={0.85}
        >
          <Feather name="send" size={18} color={rating > 0 ? "#fff" : colors.textLight} />
          <Text style={[styles.submitBtnText, { color: rating > 0 ? "#fff" : colors.textLight }]}>
            {loading ? "جاري الإرسال..." : "إرسال التقييم"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", textAlign: "center" },
  driverBox: { alignItems: "center", gap: 8, paddingTop: 8 },
  driverAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
  driverInitial: { fontSize: 34, fontWeight: "800" },
  driverName: { fontSize: 20, fontWeight: "700" },
  driverSub: { fontSize: 13 },
  pricePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginTop: 4 },
  pricePillText: { fontSize: 14, fontWeight: "700" },
  favoriteButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, marginTop: 12 },
  favoriteButtonText: { fontSize: 13, fontWeight: "600" },
  alreadyFavoriteBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginTop: 8 },
  alreadyFavoriteText: { fontSize: 12, fontWeight: "600" },
  starsSection: { alignItems: "center", gap: 10 },
  starsLabel: { fontSize: 17, fontWeight: "700" },
  starsRow: { flexDirection: "row", gap: 10 },
  ratingLabel: { fontSize: 16, fontWeight: "700" },
  tagsSection: { gap: 12 },
  tagsTitle: { fontSize: 15, fontWeight: "700" },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tagChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  tagIcon: { fontSize: 14 },
  tagLabel: { fontSize: 13, fontWeight: "600" },
  commentSection: { gap: 8 },
  commentLabel: { fontSize: 14, fontWeight: "700" },
  optional: { fontWeight: "400" },
  commentInput: { borderRadius: 12, borderWidth: 1.5, padding: 14, fontSize: 14, minHeight: 90 },
  skipText: { textAlign: "center", fontSize: 13 },
  bottomBar: { padding: 16, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  submitBtnText: { fontSize: 16, fontWeight: "700" },
  successBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  successTitle: { fontSize: 26, fontWeight: "800" },
  successSub: { fontSize: 14, textAlign: "center" },
  doneBtn: { marginTop: 16, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});