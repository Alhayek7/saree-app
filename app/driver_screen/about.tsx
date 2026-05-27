// app/(driver)/about.tsx
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const APP_VERSION = "2.0.0";
const APP_BUILD = "2025.05.24";

const DRIVER_FEATURES = [
  { icon: "🏆", title: "نظام العطاءات", description: "قدم عروضك وتنافس مع سائقين آخرين" },
  { icon: "💰", title: "أرباح عادلة", description: "احصل على المبلغ الكامل بدون عمولة" },
  { icon: "📍", title: "تتبع مباشر", description: "اعرف مواقع العملاء بدقة" },
  { icon: "💬", title: "دردشة مباشرة", description: "تواصل مع العميل بسهولة" },
  { icon: "📊", title: "إحصائيات دقيقة", description: "تابع أرباحك وتوصيلاتك" },
  { icon: "🎁", title: "مكافآت ومستويات", description: "اربح مكافآت عند إنجاز التوصيلات" },
];

const TEAM_MEMBERS = [
  { name: "أحمد وسام الحايك", role: "قائد الفريق / مطور رئيسي", icon: "👑" },
  { name: "عيد أحمد أبو بيض", role: "مطور", icon: "⚡" },
  { name: "يحيى هشام أبو شرار", role: "مطور", icon: "🚀" },
];

export default function DriverAboutScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleShare = async () => {
    try {
      await Share.share({
        message: "🚀 تطبيق سريع - منصة التوصيل الذكية في غزة\n\nانضم كسائق واستفد من أرباح ممتازة ومكافآت حصرية!",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleContact = () => {
    Linking.openURL("mailto:drivers@saree3.app?subject=استفسار من سائق");
  };

  const handleWhatsApp = () => {
    Linking.openURL("https://wa.me/97059900000?text=مرحباً، أنا سائق في تطبيق سريع وأحتاج مساعدة");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: topPad,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>عن التطبيق</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary + "15" }]}>
            <Text style={styles.logoEmoji}>🚛</Text>
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>سريع</Text>
          <Text style={[styles.appTagline, { color: colors.primary }]}>Saree3 Driver</Text>
          <Text style={[styles.appVersion, { color: colors.textLight }]}>
            الإصدار {APP_VERSION} • بناء {APP_BUILD}
          </Text>
        </View>

        {/* Driver Welcome */}
        <View style={[styles.welcomeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="user-check" size={24} color="#28A745" />
          <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>مرحباً {user?.fullName || "سائق"}!</Text>
          <Text style={[styles.welcomeText, { color: colors.textGray }]}>
            أنت جزء من فريق سريع، شكراً لمساهمتك في توصيل طلبات العملاء بسرعة واحترافية.
          </Text>
        </View>

        {/* Description */}
        <View style={[styles.descriptionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.descriptionTitle, { color: colors.foreground }]}>🚀 منصة توصيل ذكية</Text>
          <Text style={[styles.descriptionText, { color: colors.textGray }]}>
            تطبيق "سريع" هو منصة توصيل ذكية تولد من قلب غزة، تهدف إلى ربط العملاء بالسائقين
            عبر نظام عطاءات شفاف. نحن نوفر لك فرصة عمل ممتازة مع أرباح عادلة ومكافآت حصرية.
          </Text>
        </View>

        {/* Mission & Vision */}
        <View style={styles.missionRow}>
          <View style={[styles.missionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.missionIcon}>🎯</Text>
            <Text style={[styles.missionTitle, { color: colors.foreground }]}>رسالتنا</Text>
            <Text style={[styles.missionText, { color: colors.textGray }]}>
              توفير فرص عمل للشباب السائقين مع أرباح عادلة
            </Text>
          </View>
          <View style={[styles.missionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.missionIcon}>👁️</Text>
            <Text style={[styles.missionTitle, { color: colors.foreground }]}>رؤيتنا</Text>
            <Text style={[styles.missionText, { color: colors.textGray }]}>
              أن نكون المنصة الأولى للسائقين في فلسطين، نقدم أفضل تجربة عمل
            </Text>
          </View>
        </View>

        {/* Features for Drivers */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>✨ مميزات العمل مع سريع</Text>
          <View style={styles.featuresGrid}>
            {DRIVER_FEATURES.map((feature, index) => (
              <View
                key={index}
                style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>{feature.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.textGray }]}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Rewards System */}
        <View style={[styles.rewardsCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Text style={[styles.rewardsTitle, { color: colors.primary }]}>🏆 نظام المكافآت</Text>
          <View style={styles.rewardsRow}>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>🥉</Text>
              <Text style={[styles.rewardValue, { color: colors.foreground }]}>50 ₪</Text>
              <Text style={[styles.rewardLabel, { color: colors.textGray }]}>100 توصيلة</Text>
            </View>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>🥈</Text>
              <Text style={[styles.rewardValue, { color: colors.foreground }]}>100 ₪</Text>
              <Text style={[styles.rewardLabel, { color: colors.textGray }]}>250 توصيلة</Text>
            </View>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>🥇</Text>
              <Text style={[styles.rewardValue, { color: colors.foreground }]}>200 ₪</Text>
              <Text style={[styles.rewardLabel, { color: colors.textGray }]}>500 توصيلة</Text>
            </View>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>💎</Text>
              <Text style={[styles.rewardValue, { color: colors.foreground }]}>500 ₪</Text>
              <Text style={[styles.rewardLabel, { color: colors.textGray }]}>1000+ توصيلة</Text>
            </View>
          </View>
        </View>

        {/* Team Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>👥 فريق العمل</Text>
          <Text style={[styles.teamSubtitle, { color: colors.textGray }]}>Geniuses of AI | GoAI</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamScroll}>
            <View style={styles.teamGrid}>
              {TEAM_MEMBERS.map((member, index) => (
                <View
                  key={index}
                  style={[styles.teamCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Text style={styles.teamIcon}>{member.icon}</Text>
                  <Text style={[styles.teamName, { color: colors.foreground }]}>{member.name}</Text>
                  <Text style={[styles.teamRole, { color: colors.textLight }]}>{member.role}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Contact & Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}
            onPress={handleShare}
          >
            <Feather name="share-2" size={20} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>شارك التطبيق</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}
            onPress={handleContact}
          >
            <Feather name="mail" size={20} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>تواصل معنا</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#25D36610", borderColor: "#25D36630" }]}
            onPress={handleWhatsApp}
          >
            <Feather name="message-circle" size={20} color="#25D366" />
            <Text style={[styles.actionBtnText, { color: "#25D366" }]}>واتساب الدعم</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.copyright, { color: colors.textLight }]}>
            © 2025 سريع - جميع الحقوق محفوظة
          </Text>
          <Text style={[styles.madeIn, { color: colors.textLight }]}>
            🇵🇸 صُنع ب❤️ في غزة
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  container: { padding: 20, paddingBottom: 40 },
  
  // Logo
  logoSection: { alignItems: "center", marginBottom: 24 },
  logoContainer: { width: 80, height: 80, borderRadius: 24, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  logoEmoji: { fontSize: 44 },
  appName: { fontSize: 28, fontWeight: "800", marginBottom: 4 },
  appTagline: { fontSize: 14, fontWeight: "600", letterSpacing: 1, marginBottom: 6 },
  appVersion: { fontSize: 11 },
  
  // Welcome
  welcomeCard: { borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center", gap: 8, marginBottom: 16 },
  welcomeTitle: { fontSize: 16, fontWeight: "700" },
  welcomeText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  
  // Description
  descriptionCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  descriptionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  descriptionText: { fontSize: 14, lineHeight: 22 },
  
  // Mission
  missionRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  missionCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center" },
  missionIcon: { fontSize: 28, marginBottom: 8 },
  missionTitle: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  missionText: { fontSize: 11, textAlign: "center", lineHeight: 16 },
  
  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  teamSubtitle: { fontSize: 13, marginBottom: 14 },
  
  // Features
  featuresGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
  featureCard: { width: "31%", borderRadius: 14, borderWidth: 1, padding: 12, alignItems: "center" },
  featureIcon: { fontSize: 28, marginBottom: 8 },
  featureTitle: { fontSize: 12, fontWeight: "700", marginBottom: 4, textAlign: "center" },
  featureDesc: { fontSize: 10, textAlign: "center", lineHeight: 14 },
  
  // Rewards
  rewardsCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24 },
  rewardsTitle: { fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 16 },
  rewardsRow: { flexDirection: "row", justifyContent: "space-around", gap: 10 },
  rewardItem: { alignItems: "center", gap: 6, flex: 1 },
  rewardIcon: { fontSize: 28 },
  rewardValue: { fontSize: 16, fontWeight: "800" },
  rewardLabel: { fontSize: 10, textAlign: "center" },
  
  // Team
  teamScroll: { flexGrow: 0 },
  teamGrid: { flexDirection: "row", gap: 12 },
  teamCard: { width: 110, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: "center", gap: 6 },
  teamIcon: { fontSize: 28 },
  teamName: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  teamRole: { fontSize: 10, textAlign: "center" },
  
  // Actions
  actionsSection: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 24 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  actionBtnText: { fontSize: 12, fontWeight: "600" },
  
  // Footer
  footer: { alignItems: "center", paddingTop: 16, borderTopWidth: 0.5, borderTopColor: "#E5E5E5" },
  copyright: { fontSize: 11, marginBottom: 4 },
  madeIn: { fontSize: 11 },
});