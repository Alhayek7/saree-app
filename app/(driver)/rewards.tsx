// app/(driver)/rewards.tsx
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// تعريف المستويات والمكافئات
interface Tier {
  id: string;
  name: string;
  nameAr: string;
  minDeliveries: number;
  maxDeliveries: number;
  bonus: number;
  icon: string;
  color: string;
  badgeColor: string;
  perks: string[];
}

const TIERS: Tier[] = [
  {
    id: "bronze",
    name: "Bronze",
    nameAr: "🥉 برونزي",
    minDeliveries: 0,
    maxDeliveries: 99,
    bonus: 50,
    icon: "award",
    color: "#CD7F32",
    badgeColor: "#CD7F3220",
    perks: ["مكافأة ترحيبية 50 ₪", "دعم أساسي", "عروض حصرية"],
  },
  {
    id: "silver",
    name: "Silver",
    nameAr: "🥈 فضي",
    minDeliveries: 100,
    maxDeliveries: 249,
    bonus: 100,
    icon: "award",
    color: "#C0C0C0",
    badgeColor: "#C0C0C020",
    perks: ["مكافأة 100 ₪", "أولوية الدعم", "خصم 5% على العمولة", "شعار فضي"],
  },
  {
    id: "gold",
    name: "Gold",
    nameAr: "🥇 ذهبي",
    minDeliveries: 250,
    maxDeliveries: 499,
    bonus: 200,
    icon: "award",
    color: "#FFD700",
    badgeColor: "#FFD70020",
    perks: ["مكافأة 200 ₪", "دعم VIP", "خصم 10% على العمولة", "شعار ذهبي", "أولوية الطلبات"],
  },
  {
    id: "platinum",
    name: "Platinum",
    nameAr: "💎 بلاتيني",
    minDeliveries: 500,
    maxDeliveries: 999,
    bonus: 500,
    icon: "star",
    color: "#E5E4E2",
    badgeColor: "#E5E4E220",
    perks: ["مكافأة 500 ₪", "دعم خاص", "خصم 15% على العمولة", "شعار بلاتيني", "أولوية قصوى", "هدية سنوية"],
  },
  {
    id: "diamond",
    name: "Diamond",
    nameAr: "💎💎 ألماس",
    minDeliveries: 1000,
    maxDeliveries: Infinity,
    bonus: 1000,
    icon: "star",
    color: "#B9F2FF",
    badgeColor: "#B9F2FF20",
    perks: ["مكافأة 1000 ₪", "دعم حصري", "خصم 20% على العمولة", "شعار ألماس", "شريك مميز", "هدية سنوية 500 ₪"],
  },
];

// تعريف المكافئات التدريجية
const MILESTONE_REWARDS = [
  { deliveries: 50, reward: 25, icon: "🎁", description: "مكافأة الـ 50 توصيلة" },
  { deliveries: 100, reward: 100, icon: "🏆", description: "مكافأة الـ 100 توصيلة" },
  { deliveries: 250, reward: 200, icon: "🏅", description: "مكافأة الـ 250 توصيلة" },
  { deliveries: 500, reward: 500, icon: "💎", description: "مكافأة الـ 500 توصيلة" },
  { deliveries: 1000, reward: 1000, icon: "👑", description: "مكافأة الـ 1000 توصيلة" },
];

export default function RewardsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getMyOrders } = useOrders();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [showTierDetails, setShowTierDetails] = useState(false);
  
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const myOrders = getMyOrders(user?.id || "");
  const completedOrders = myOrders.filter(o => o.status === "completed");
  const totalDeliveries = completedOrders.length;
  
  // تحديد المستوى الحالي
  const currentTier = TIERS.find(t => totalDeliveries >= t.minDeliveries && totalDeliveries <= t.maxDeliveries) || TIERS[0];
  const nextTier = TIERS.find(t => t.minDeliveries > totalDeliveries);
  
  // حساب التقدم للمستوى التالي
  const deliveriesToNextTier = nextTier ? nextTier.minDeliveries - totalDeliveries : 0;
  const progressPercent = nextTier 
    ? (totalDeliveries - currentTier.minDeliveries) / (nextTier.minDeliveries - currentTier.minDeliveries) * 100
    : 100;
  
  // حساب المكافآت المحققة
  const achievedRewards = MILESTONE_REWARDS.filter(r => totalDeliveries >= r.deliveries);
  const nextReward = MILESTONE_REWARDS.find(r => totalDeliveries < r.deliveries);
  
  // إجمالي المكافآت المستلمة
  const totalRewardsEarned = achievedRewards.reduce((sum, r) => sum + r.reward, 0);
  
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  const handleTierPress = (tier: Tier) => {
    setSelectedTier(tier);
    setShowTierDetails(true);
  };
  
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: "#28A745", paddingTop: topPad + 16 }]}>
          <Text style={styles.headerTitle}>🏆 المكافئات والمستويات</Text>
          <Text style={styles.headerSubtitle}>اربح مكافآت أكثر مع كل توصيلة</Text>
        </View>

        {/* المستوى الحالي */}
        <View style={[styles.currentTierCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.currentTierHeader}>
            <View style={[styles.currentTierIcon, { backgroundColor: currentTier.badgeColor }]}>
              <Feather name={currentTier.icon as any} size={28} color={currentTier.color} />
            </View>
            <View>
              <Text style={[styles.currentTierLabel, { color: colors.textGray }]}>المستوى الحالي</Text>
              <Text style={[styles.currentTierName, { color: currentTier.color }]}>{currentTier.nameAr}</Text>
            </View>
            <View style={[styles.deliveriesBadge, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="package" size={12} color={colors.primary} />
              <Text style={[styles.deliveriesBadgeText, { color: colors.primary }]}>{totalDeliveries} توصيلة</Text>
            </View>
          </View>
          
          {/* شريط التقدم */}
          {nextTier && (
            <>
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressLabel, { color: colors.textGray }]}>
                    🚀 التقدم إلى {nextTier.nameAr}
                  </Text>
                  <Text style={[styles.progressValue, { color: colors.primary }]}>
                    {totalDeliveries} / {nextTier.minDeliveries}
                  </Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: currentTier.color }]} />
                </View>
                <Text style={[styles.progressHint, { color: colors.textLight }]}>
                  متبقي {deliveriesToNextTier} توصيلة للانتقال إلى المستوى {nextTier.nameAr} ومكافأة {nextTier.bonus} ₪
                </Text>
              </View>
            </>
          )}
          
          {!nextTier && (
            <View style={[styles.maxLevelCard, { backgroundColor: colors.primary + "10" }]}>
              <Feather name="star" size={20} color={colors.primary} />
              <Text style={[styles.maxLevelText, { color: colors.primary }]}>🎉 مبروك! وصلت لأعلى مستوى!</Text>
            </View>
          )}
        </View>

        {/* إحصائيات سريعة */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="gift" size={20} color="#FFC107" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{totalRewardsEarned} ₪</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>إجمالي المكافآت</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="truck" size={20} color="#28A745" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{totalDeliveries}</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>إجمالي التوصيلات</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="award" size={20} color="#6C63FF" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{currentTier.name}</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>المستوى</Text>
          </View>
        </View>

        {/* المكافأة القادمة */}
        {nextReward && (
          <View style={[styles.nextRewardCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <Text style={styles.nextRewardEmoji}>🎯</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nextRewardTitle, { color: colors.primary }]}>المكافأة القادمة</Text>
              <Text style={[styles.nextRewardDesc, { color: colors.textGray }]}>
                أكمل {nextReward.deliveries - totalDeliveries} توصيلات أخرى لتحصل على {nextReward.reward} ₪
              </Text>
            </View>
            <Feather name="chevron-left" size={16} color={colors.primary} />
          </View>
        )}

        {/* قائمة المكافئات التدريجية */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📊 المكافئات التدريجية</Text>
          <View style={[styles.milestonesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {MILESTONE_REWARDS.map((reward, index) => {
              const isAchieved = totalDeliveries >= reward.deliveries;
              return (
                <View key={index} style={[styles.milestoneRow, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <View style={[styles.milestoneIcon, { backgroundColor: isAchieved ? "#28A74515" : colors.muted }]}>
                    <Text style={{ fontSize: 20 }}>{reward.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.milestoneTitle, { color: isAchieved ? "#28A745" : colors.foreground }]}>
                      {reward.deliveries} توصيلة
                    </Text>
                    <Text style={[styles.milestoneDesc, { color: colors.textGray }]}>{reward.description}</Text>
                  </View>
                  <View style={[styles.milestoneReward, { backgroundColor: isAchieved ? "#28A74515" : colors.muted }]}>
                    <Text style={[styles.milestoneRewardText, { color: isAchieved ? "#28A745" : colors.textGray }]}>
                      {isAchieved ? "✓ تم" : `+${reward.reward} ₪`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* قائمة المستويات */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🏅 المستويات والمزايا</Text>
          <View style={styles.tiersList}>
            {TIERS.map((tier) => {
              const isUnlocked = totalDeliveries >= tier.minDeliveries;
              const isCurrent = currentTier.id === tier.id;
              return (
                <TouchableOpacity
                  key={tier.id}
                  style={[
                    styles.tierCard,
                    {
                      backgroundColor: isCurrent ? tier.badgeColor : colors.card,
                      borderColor: isCurrent ? tier.color : colors.border,
                      borderWidth: isCurrent ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleTierPress(tier)}
                  activeOpacity={0.8}
                >
                  <View style={styles.tierCardLeft}>
                    <View style={[styles.tierIcon, { backgroundColor: tier.badgeColor }]}>
                      <Feather name={tier.icon as any} size={22} color={tier.color} />
                    </View>
                    <View>
                      <Text style={[styles.tierName, { color: isUnlocked ? tier.color : colors.textGray }]}>{tier.nameAr}</Text>
                      <Text style={[styles.tierRequirement, { color: colors.textLight }]}>
                        {tier.minDeliveries} - {tier.maxDeliveries === Infinity ? "∞" : tier.maxDeliveries} توصيلة
                      </Text>
                    </View>
                  </View>
                  <View style={styles.tierCardRight}>
                    {isCurrent && (
                      <View style={[styles.currentBadge, { backgroundColor: tier.color }]}>
                        <Text style={styles.currentBadgeText}>الحالي</Text>
                      </View>
                    )}
                    <Text style={[styles.tierBonus, { color: tier.color }]}>+{tier.bonus} ₪</Text>
                    <Feather name="chevron-left" size={14} color={colors.textLight} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* نصائح */}
        <View style={[styles.tipsCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="help-circle" size={18} color={colors.primary} />
          <Text style={[styles.tipsText, { color: colors.textGray }]}>
            💡 كلما زادت توصيلاتك، زادت مكافآتك! المستوى البلاتيني يمنحك خصم 15% على العمولة وأولوية في الطلبات.
          </Text>
        </View>
      </ScrollView>

      {/* Modal تفاصيل المستوى */}
      <Modal
        visible={showTierDetails}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTierDetails(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTierDetails(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={[styles.modalIcon, { backgroundColor: selectedTier?.badgeColor }]}>
                <Feather name={selectedTier?.icon as any} size={28} color={selectedTier?.color} />
              </View>
              <Text style={[styles.modalTitle, { color: selectedTier?.color }]}>{selectedTier?.nameAr}</Text>
              <TouchableOpacity onPress={() => setShowTierDetails(false)} style={styles.modalClose}>
                <Feather name="x" size={20} color={colors.textGray} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.modalInfoRow}>
                <Feather name="target" size={16} color={colors.primary} />
                <Text style={[styles.modalInfoText, { color: colors.textGray }]}>
                  يتطلب {selectedTier?.minDeliveries} - {selectedTier?.maxDeliveries === Infinity ? "∞" : selectedTier?.maxDeliveries} توصيلة
                </Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Feather name="gift" size={16} color="#FFC107" />
                <Text style={[styles.modalInfoText, { color: colors.textGray }]}>
                  مكافأة الترقية: {selectedTier?.bonus} ₪
                </Text>
              </View>
              
              <Text style={[styles.modalPerksTitle, { color: colors.foreground }]}>✨ المزايا:</Text>
              {selectedTier?.perks.map((perk, index) => (
                <View key={index} style={styles.modalPerkRow}>
                  <Feather name="check-circle" size={14} color={colors.primary} />
                  <Text style={[styles.modalPerkText, { color: colors.textGray }]}>{perk}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: selectedTier?.color || colors.primary }]}
              onPress={() => setShowTierDetails(false)}
            >
              <Text style={styles.modalButtonText}>حسناً</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  
  // Header
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 },
  
  // Current Tier Card
  currentTierCard: { marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 16, borderWidth: 1, gap: 16 },
  currentTierHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  currentTierIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  currentTierLabel: { fontSize: 12 },
  currentTierName: { fontSize: 18, fontWeight: "800" },
  deliveriesBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  deliveriesBadgeText: { fontSize: 11, fontWeight: "600" },
  
  // Progress
  progressSection: { gap: 8 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { fontSize: 12 },
  progressValue: { fontSize: 13, fontWeight: "700" },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressHint: { fontSize: 11, marginTop: 4 },
  
  // Stats
  statsRow: { flexDirection: "row", gap: 12, padding: 16 },
  statCard: { flex: 1, alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1, gap: 6 },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11, textAlign: "center" },
  
  // Next Reward
  nextRewardCard: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginBottom: 16, padding: 14, borderRadius: 14, borderWidth: 1 },
  nextRewardEmoji: { fontSize: 28 },
  nextRewardTitle: { fontSize: 14, fontWeight: "700" },
  nextRewardDesc: { fontSize: 12, marginTop: 2 },
  
  // Section
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  
  // Milestones
  milestonesCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  milestoneRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  milestoneIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  milestoneTitle: { fontSize: 14, fontWeight: "700" },
  milestoneDesc: { fontSize: 11, marginTop: 2 },
  milestoneReward: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  milestoneRewardText: { fontSize: 12, fontWeight: "600" },
  
  // Tiers List
  tiersList: { gap: 10 },
  tierCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1 },
  tierCardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  tierIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  tierName: { fontSize: 15, fontWeight: "700" },
  tierRequirement: { fontSize: 11, marginTop: 2 },
  tierCardRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  currentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  currentBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  tierBonus: { fontSize: 14, fontWeight: "800" },
  
  // Tips
  tipsCard: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: 14, borderWidth: 1 },
  tipsText: { flex: 1, fontSize: 12 },
  
  maxLevelCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10 },
  maxLevelText: { fontSize: 13, fontWeight: "600" },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  modalContainer: { width: "100%", borderRadius: 24, overflow: "hidden" },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderBottomWidth: 1 },
  modalIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  modalTitle: { flex: 1, fontSize: 20, fontWeight: "800" },
  modalClose: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  modalContent: { padding: 16, gap: 12 },
  modalInfoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  modalInfoText: { fontSize: 13 },
  modalPerksTitle: { fontSize: 15, fontWeight: "700", marginTop: 8, marginBottom: 4 },
  modalPerkRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  modalPerkText: { fontSize: 13, flex: 1 },
  modalButton: { paddingVertical: 16, alignItems: "center", marginHorizontal: 16, marginBottom: 16, borderRadius: 14 },
  modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});