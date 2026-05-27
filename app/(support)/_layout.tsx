// app/(support)/_layout.tsx
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs, useRouter, Redirect } from "expo-router";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#00ACC1",
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
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: "الرئيسية", 
          tabBarIcon: ({ color }) => isIOS 
            ? <SymbolView name="house" tintColor={color} size={22} /> 
            : <Feather name="home" size={22} color={color} /> 
        }} 
      />

      <Tabs.Screen 
        name="tickets" 
        options={{ 
          title: "التذاكر", 
          tabBarIcon: ({ color }) => isIOS 
            ? <SymbolView name="ticket" tintColor={color} size={22} /> 
            : <Feather name="message-square" size={22} color={color} /> 
        }} 
      />

      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: "حسابي", 
          tabBarIcon: ({ color }) => isIOS 
            ? <SymbolView name="person" tintColor={color} size={22} /> 
            : <Feather name="user" size={22} color={color} /> 
        }} 
      />
    </Tabs>
  );
}

export default function SupportLayout() {
  const { user, isLoading } = useAuth();
  
  // انتظار تحميل حالة المصادقة
  if (isLoading) {
    return null; // أو يمكن إضافة شاشة تحميل
  }
  
  // التحقق من أن المستخدم مسجل الدخول وله دور support
  if (!user || user.role !== "support") {
    // إعادة التوجيه إلى صفحة تسجيل الدخول مع تحديد دور support
    return <Redirect href="/login?role=support" />;
  }
  
  return <ClassicTabLayout />;
}