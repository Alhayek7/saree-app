import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, useRouter } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

// ============================================================
// تبويبات الأجهزة الحديثة (iOS مع تأثير زجاجي)
// ============================================================
function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>الرئيسية</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="available-orders">
        <Icon sf={{ default: "truck.box", selected: "truck.box.fill" }} />
        <Label>طلبات متاحة</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="earnings">
        <Icon sf={{ default: "banknote", selected: "banknote.fill" }} />
        <Label>أرباحي</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="rewards">
        <Icon sf={{ default: "gift", selected: "gift.fill" }} />
        <Label>مكافآت</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="agents">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>وكلاء</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// ============================================================
// تبويبات الأجهزة الكلاسيكية (Android / Web)
// ============================================================
function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#28A745",
        tabBarInactiveTintColor: colors.textGray,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === "web" ? 72 : 60,
          paddingBottom: Platform.OS === "web" ? 12 : 8,
          paddingTop: Platform.OS === "web" ? 10 : 6,
        },
        tabBarBackground: () =>
          isIOS ? <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} /> : null,
      }}
    >
      {/* التبويب 1: الرئيسية */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: "الرئيسية", 
          tabBarIcon: ({ color }) => isIOS 
            ? <SymbolView name="house" tintColor={color} size={22} /> 
            : <Feather name="home" size={22} color={color} /> 
        }} 
      />

      {/* التبويب 2: طلبات متاحة */}
      <Tabs.Screen 
        name="available-orders" 
        options={{ 
          title: "طلبات متاحة", 
          tabBarIcon: ({ color }) => isIOS 
            ? <SymbolView name="truck.box" tintColor={color} size={22} /> 
            : <Feather name="truck" size={22} color={color} /> 
        }} 
      />

      {/* التبويب 3: أرباحي */}
      <Tabs.Screen 
        name="earnings" 
        options={{ 
          title: "أرباحي", 
          tabBarIcon: ({ color }) => isIOS 
            ? <SymbolView name="banknote" tintColor={color} size={22} /> 
            : <Feather name="bar-chart-2" size={22} color={color} /> 
        }} 
      />

      {/* التبويب 4: مكافآت */}
      <Tabs.Screen 
        name="rewards" 
        options={{ 
          title: "مكافآت", 
          tabBarIcon: ({ color }) => isIOS 
            ? <SymbolView name="gift" tintColor={color} size={22} /> 
            : <Feather name="award" size={22} color={color} /> 
        }} 
      />

      {/* التبويب 5: وكلاء */}
      <Tabs.Screen 
        name="agents" 
        options={{ 
          title: "وكلاء", 
          tabBarIcon: ({ color }) => isIOS 
            ? <SymbolView name="person.2" tintColor={color} size={22} /> 
            : <Feather name="users" size={22} color={color} /> 
        }} 
      />
    </Tabs>
  );
}

// ============================================================
// المكون الرئيسي
// ============================================================
export default function DriverLayout() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/role-select" as any);
    }
  }, [isLoggedIn]);

  // اختيار التصميم حسب الجهاز
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}