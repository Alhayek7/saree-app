// app/faq.tsx
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: keyof typeof Feather.glyphMap;
  category: "general" | "order" | "payment" | "driver";
}

const FAQS: FAQItem[] = [
  // General
  {
    id: "1",
    question: "ما هو تطبيق سريع؟",
    answer: "تطبيق سريع هو منصة توصيل ذكية تربط العملاء بالسائقين عبر نظام عطاءات شفاف، مما يتيح لك الحصول على أفضل سعر وأسرع خدمة في غزة.",
    icon: "info",
    category: "general",
  },
  {
    id: "2",
    question: "كيف يمكنني التسجيل في التطبيق؟",
    answer: "يمكنك التسجيل بسهولة عبر الضغط على 'إنشاء حساب' واختيار نوع الحساب (عميل/سائق/وكيل). ستحتاج إلى إدخال رقم هاتفك واسمك الكامل وكلمة مرور.",
    icon: "user-plus",
    category: "general",
  },
  // Order
  {
    id: "3",
    question: "كيف يمكنني إنشاء طلب توصيل؟",
    answer: "اضغط على 'طلب جديد'، ثم أدخل عنوان الاستلام والتسليم، ووصف الطرد، واختر نوع المركبة المناسبة، ثم أرسل الطلب. ستصل العروض خلال 5 ثوانٍ.",
    icon: "package",
    category: "order",
  },
  {
    id: "4",
    question: "كم تستغرق عملية البحث عن سائق؟",
    answer: "عادةً ما تستغرق عملية البحث عن سائق أقل من دقيقة. بعدها سترى أفضل 3 عروض أسعار من سائقين متاحين.",
    icon: "clock",
    category: "order",
  },
  {
    id: "5",
    question: "ماذا يعني نظام العطاءات؟",
    answer: "نظام العطاءات يتيح للسائقين المنافسة على طلبك بأفضل الأسعار. أنت ترى أرخص 3 عروض وتختار الأنسب لك من حيث السعر والتقييم والوقت المقدر.",
    icon: "tag",
    category: "order",
  },
  {
    id: "6",
    question: "كيف أضيف سائقاً إلى مفضلاتي؟",
    answer: "بعد إتمام الطلب، ستظهر شاشة التقييم. يمكنك تقييم السائق وإضافته إلى مفضلاتك، وفي المرات القادمة ستتمكن من طلبه مباشرة وتحديد السعر بنفسك.",
    icon: "star",
    category: "order",
  },
  // Payment
  {
    id: "7",
    question: "ما هي طرق الدفع المتاحة؟",
    answer: "تطبيق سريع يوفر خيارين: الدفع نقداً عند الاستلام (تدفع للسائق مباشرة) أو الدفع الإلكتروني (عبر بطاقة أو تحويل بنكي خارج التطبيق).",
    icon: "credit-card",
    category: "payment",
  },
  {
    id: "8",
    question: "هل يوجد عمولة على التطبيق؟",
    answer: "لا، تطبيق سريع لا يخصم أي عمولة. أنت تدفع المبلغ الذي تتفق عليه مع السائق مباشرة، بدون رسوم إضافية.",
    icon: "shield",
    category: "payment",
  },
  // Driver
  {
    id: "9",
    question: "كيف أصبح سائقاً في تطبيق سريع؟",
    answer: "سجل كسائق، أضف بياناتك ورقم هويتك ونوع مركبتك. بعد موافقة الإدارة، يمكنك البدء في استلام الطلبات وتقديم عروض الأسعار.",
    icon: "truck",
    category: "driver",
  },
  {
    id: "10",
    question: "كيف يحصل السائق على المال؟",
    answer: "السائق يتسلم المبلغ نقداً من العميل عند التوصيل. التطبيق لا يتوسط في عملية الدفع، بل ينظم عملية الربط بين العميل والسائق فقط.",
    icon: "dollar-sign",
    category: "driver",
  },
];

const CATEGORY_TABS: { key: FAQItem["category"]; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "general", label: "عام", icon: "home" },
  { key: "order", label: "الطلبات", icon: "package" },
  { key: "payment", label: "الدفع", icon: "credit-card" },
  { key: "driver", label: "السائقين", icon: "truck" },
];

function FAQCard({ item, isExpanded, onToggle }: { item: FAQItem; isExpanded: boolean; onToggle: () => void }) {
  const colors = useColors();
  const [heightAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const answerHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onToggle();
      }}
      style={[
        styles.faqCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.faqHeader}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + "15" }]}>
          <Feather name={item.icon} size={20} color={colors.primary} />
        </View>
        <Text style={[styles.questionText, { color: colors.foreground, flex: 1 }]}>{item.question}</Text>
        <Feather
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textGray}
        />
      </View>

      {isExpanded && (
        <Animated.View style={[styles.answerContainer, { opacity: heightAnim }]}>
          <View style={[styles.answerDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.answerText, { color: colors.textGray }]}>{item.answer}</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

export default function FAQScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<FAQItem["category"]>("general");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFAQs = FAQS.filter((faq) => faq.category === activeCategory);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>الأسئلة الشائعة</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero Section */}
      <View style={[styles.heroSection, { backgroundColor: colors.primary + "08" }]}>
        <View style={[styles.heroIcon, { backgroundColor: colors.primary + "15" }]}>
          <Feather name="help-circle" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>كيف يمكننا مساعدتك؟</Text>
        <Text style={[styles.heroSub, { color: colors.textGray }]}>
          إجابات على الأسئلة الأكثر شيوعاً حول تطبيق سريع
        </Text>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={[styles.tabsWrapper, { backgroundColor: colors.background }]}
      >
        {CATEGORY_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              {
                backgroundColor: activeCategory === tab.key ? colors.primary : colors.card,
                borderColor: activeCategory === tab.key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              setActiveCategory(tab.key);
              setExpandedId(null);
            }}
          >
            <Feather
              name={tab.icon}
              size={16}
              color={activeCategory === tab.key ? "#fff" : colors.primary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeCategory === tab.key ? "#fff" : colors.foreground },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FAQ List */}
      <ScrollView
        contentContainerStyle={styles.faqList}
        showsVerticalScrollIndicator={false}
      >
        {filteredFAQs.map((faq) => (
          <FAQCard
            key={faq.id}
            item={faq}
            isExpanded={expandedId === faq.id}
            onToggle={() => toggleExpand(faq.id)}
          />
        ))}

        {/* Contact Support */}
        <View
          style={[
            styles.contactCard,
            {
              backgroundColor: colors.muted,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.contactIcon, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="headphones" size={24} color={colors.primary} />
          </View>
          <View style={styles.contactContent}>
            <Text style={[styles.contactTitle, { color: colors.foreground }]}>لم تجد إجابتك؟</Text>
            <Text style={[styles.contactSub, { color: colors.textGray }]}>
              تواصل مع فريق الدعم الفني لحل مشكلتك
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/faq")}
          >
            <Text style={styles.contactBtnText}>اتصل بنا</Text>
            <Feather name="chevron-left" size={16} color="#fff" />
          </TouchableOpacity>
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
  heroSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 14,
    textAlign: "center",
  },
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  faqList: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  faqCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  questionText: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  answerContainer: {
    marginTop: 12,
  },
  answerDivider: {
    height: 1,
    marginBottom: 12,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 22,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  contactSub: {
    fontSize: 12,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  contactBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});