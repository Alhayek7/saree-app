// app/about.tsx
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Image, 
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

const APP_VERSION = "1.0.0";
const APP_BUILD = "2026.05.25";

const TEAM_MEMBERS = [
  { name: "أحمد وسام الحايك", role: "قائد الفريق / مطور رئيسي", icon: "👑" },
  { name: "عيد أحمد أبو بيض", role: "مطور", icon: "⚡" },
  { name: "يحيى هشام أبو شرار", role: "مطور", icon: "🚀" },
];

const FEATURES = [
  { icon: "🏆", title: "نظام العطاءات", description: "السائقون يتنافسون بأفضل الأسعار" },
  { icon: "⭐", title: "سائقين مفضلين", description: "اختر سائقك المفضل وحدد السعر" },
  { icon: "📍", title: "تتبع مباشر", description: "تعرف على موقع طردك لحظة بلحظة" },
  { icon: "💬", title: "دردشة مباشرة", description: "تواصل مع السائق بسهولة" },
  { icon: "📦", title: "توصيل سريع", description: "خدمة توصيل موثوقة في غزة" },
  { icon: "💰", title: "دفع نقداً", description: "ادفع للسائق نقداً عند الاستلام" },
];

export default function AboutScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleShare = async () => {
    try {
      await Share.share({
        message: "🚀 تطبيق سريع - منصة التوصيل الذكية في غزة\n\nحمّل التطبيق الآن واستمتع بخدمة توصيل سريعة وموثوقة!",
        url: "https://saree.app",
        title: "شارك تطبيق سريع",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleRate = () => {
    // ربط بمتجر التطبيقات
    const storeUrl = Platform.select({
      ios: "https://apps.apple.com/app/idXXXXX",
      android: "https://play.google.com/store/apps/details?id=com.saree3.app",
    });
    if (storeUrl) Linking.openURL(storeUrl);
  };

  const handleEmail = () => {
    Linking.openURL("mailto:support@saree3.app?subject=استفسار عن تطبيق سريع");
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
{/* Logo Section - مع الصورة الجديدة */}
<View style={styles.logoSection}>
  <View style={[styles.logoContainer, { backgroundColor: "#2E7D32" + "15" }]}>
    <Image 
      source={require("@/assets/icons/app-icon.png")} 
      style={styles.logoImage}
      resizeMode="contain"
    />
  </View>
  <Text style={[styles.appName, { color: "#2E7D32" }]}>سريع</Text>
  <Text style={[styles.appTagline, { color: "#2E7D32" }]}>Saree</Text>
  <Text style={[styles.appVersion, { color: colors.textLight }]}>
    الإصدار {APP_VERSION} • بناء {APP_BUILD}
  </Text>
</View>

        {/* Description */}
        <View style={[styles.descriptionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.descriptionTitle, { color: colors.foreground }]}>🚀 منصة توصيل ذكية</Text>
          <Text style={[styles.descriptionText, { color: colors.textGray }]}>
            تطبيق "سريع" هو منصة توصيل ذكية تولد من قلب غزة، تهدف إلى حل مشكلة التوصيل
            غير الموحد في القطاع. نوفر نظام عطاءات شفاف يربط العملاء بالسائقين بأفضل الأسعار،
            مع تتبع حي ومباشر للطلبات.
          </Text>
        </View>

        {/* Mission & Vision */}
        <View style={styles.missionRow}>
          <View style={[styles.missionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.missionIcon}>🎯</Text>
            <Text style={[styles.missionTitle, { color: colors.foreground }]}>رسالتنا</Text>
            <Text style={[styles.missionText, { color: colors.textGray }]}>
              تمكين أهالي غزة من خدمة توصيل سريعة وموثوقة وبأسعار عادلة
            </Text>
          </View>
          <View style={[styles.missionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.missionIcon}>👁️</Text>
            <Text style={[styles.missionTitle, { color: colors.foreground }]}>رؤيتنا</Text>
            <Text style={[styles.missionText, { color: colors.textGray }]}>
              أن نكون المنصة الأولى للتوصيل في فلسطين، نربط المجتمع ونوفر فرص عمل للشباب
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>✨ الميزات الرئيسية</Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
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

        {/* Team Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>👥 فريق العمل</Text>
          <Text style={[styles.teamSubtitle, { color: colors.textGray }]}>Geniuses of AI | GoAI</Text>
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamScroll}>
  <View style={styles.teamGridHorizontal}>
    {TEAM_MEMBERS.map((member, index) => (
      <View key={index} style={[styles.teamCardHorizontal, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.teamIcon}>{member.icon}</Text>
        <Text style={[styles.teamName, { color: colors.foreground }]}>{member.name}</Text>
        <Text style={[styles.teamRole, { color: colors.textLight }]}>{member.role}</Text>
      </View>
    ))}
  </View>
</ScrollView>
        </View>

        {/* Tech Stack */}
        <View style={[styles.techCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.techTitle, { color: colors.foreground }]}>🛠️ التقنيات المستخدمة</Text>
          <View style={styles.techTags}>
            {["React Native", "Expo", "TypeScript", "Supabase", "Google Maps", "Expo Router"].map((tech) => (
              <View key={tech} style={[styles.techTag, { backgroundColor: colors.primary + "10" }]}>
                <Text style={[styles.techTagText, { color: colors.primary }]}>{tech}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact & Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]} onPress={handleShare}>
            <Feather name="share-2" size={20} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>شارك التطبيق</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]} onPress={handleRate}>
            <Feather name="star" size={20} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>قيّم التطبيق</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]} onPress={handleEmail}>
            <Feather name="mail" size={20} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>تواصل معنا</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.copyright, { color: colors.textLight }]}>
            © 2026 سريع - جميع الحقوق محفوظة
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
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 44,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 6,
  },
  appVersion: {
    fontSize: 11,
  },
  descriptionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  missionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  missionCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
  },
  missionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  missionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  missionText: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  teamSubtitle: {
    fontSize: 13,
    marginBottom: 14,
  },
featuresGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 10,
},
featureCard: {
  width: "31%",
  borderRadius: 14,
  borderWidth: 1,
  padding: 12,
  alignItems: "center",
  marginBottom: 10,
},
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  featureDesc: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
  },
  teamGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  teamCard: {
    width: "31%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
  },
  teamIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  teamName: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 2,
  },
  teamRole: {
    fontSize: 10,
    textAlign: "center",
  },
  techCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  techTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  techTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  techTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  techTagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 24,
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
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E5E5",
  },
  copyright: {
    fontSize: 11,
    marginBottom: 4,
  },
  madeIn: {
    fontSize: 11,
  },
  teamScroll: {
  flexGrow: 0,
},
teamGridHorizontal: {
  flexDirection: "row",
  gap: 12,
},
teamCardHorizontal: {
  width: 110,
  borderRadius: 14,
  borderWidth: 1,
  padding: 12,
  alignItems: "center",
  gap: 6,
},
logoImage: {
  width: 60,
  height: 60,
  borderRadius: 16,
},
});