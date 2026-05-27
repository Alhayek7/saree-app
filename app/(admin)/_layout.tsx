// app/(admin)/_layout.tsx
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, Redirect } from "expo-router";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const ADMIN_COLOR = "#1E88E5";
const ADMIN_COLOR_LIGHT = "#1E88E520";

// ✅ 6 تبويبات الآن
const TAB_ICONS = {
  index: { title: "الرئيسية", feather: "home", sf: "house" },
  users: { title: "المستخدمين", feather: "users", sf: "person.3" },
  drivers: { title: "السائقين", feather: "truck", sf: "car" },
  stores: { title: "المتاجر", feather: "shopping-bag", sf: "bag" },        // ✅ جديد
  recharge: { title: "طلبات الشحن", feather: "refresh-cw", sf: "arrow.clockwise" },
  settings: { title: "الإعدادات", feather: "settings", sf: "gear" },
} as const;

// ✅ أضف stores في الترتيب
const TAB_ORDER = ["index", "users", "drivers", "stores", "recharge", "settings"] as const;

// تبويبات كلاسيكية
function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ADMIN_COLOR,
        tabBarInactiveTintColor: colors.textGray,
        headerShown: false,
        tabBarLabelStyle: { 
          fontSize: 10, 
          fontWeight: "500",
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 0,
          elevation: 0,
          height: 52,
          paddingBottom: 6,
          paddingTop: 6,
           bottom: 20, 
        },
        tabBarBackground: () => 
          isIOS ? <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} /> : null,
      }}
    >
      {TAB_ORDER.map((tabName) => {
        const tab = TAB_ICONS[tabName];
        return (
          <Tabs.Screen
            key={tabName}
            name={tabName}
            options={{
              title: tab.title,
              tabBarIcon: ({ color }) => 
                isIOS ? (
                  <SymbolView name={tab.sf as any} tintColor={color} size={18} />  // ✅ تصغير الأيقونة قليلاً
                ) : (
                  <Feather name={tab.feather as any} size={18} color={color} />   // ✅ تصغير الأيقونة قليلاً
                ),
            }}
          />
        );
      })}

      {/* ✅ الشاشات المخفية (لا تظهر في الشريط السفلي) */}
      <Tabs.Screen name="orders" options={{ href: null, title: "الطلبات" }} />
      <Tabs.Screen name="finance" options={{ href: null, title: "المالية" }} />
      <Tabs.Screen name="recharge-requests" options={{ href: null }} />
    </Tabs>
  );
}

// تبويبات الواجهة الزجاجية
function GlassTabLayout() {
  const { NativeTabs, Icon, Label } = require("expo-router/unstable-native-tabs");
  
  return (
    <NativeTabs>
      {TAB_ORDER.map((tabName) => {
        const tab = TAB_ICONS[tabName];
        return (
          <NativeTabs.Trigger key={tabName} name={tabName}>
            <Icon sf={{ default: tab.sf, selected: `${tab.sf}.fill` as any }} />
            <Label>{tab.title}</Label>
          </NativeTabs.Trigger>
        );
      })}
    </NativeTabs>
  );
}

// شاشة تحميل
function LoadingScreen() {
  const colors = useColors();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.loadingIcon, { backgroundColor: ADMIN_COLOR_LIGHT }]}>
        <Feather name="shield" size={40} color={ADMIN_COLOR} />
      </View>
      <ActivityIndicator size="large" color={ADMIN_COLOR} />
    </View>
  );
}

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect href="/role-select" />;
  if (user.role !== "admin") return <Redirect href="/" />;
  
  if (isLiquidGlassAvailable()) {
    return <GlassTabLayout />;
  }
  
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    gap: 16,
  },
  loadingIcon: { 
    width: 80, 
    height: 80, 
    borderRadius: 24, 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 8,
  },
});