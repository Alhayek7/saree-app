// app/(store-owner)/_layout.tsx
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs, Redirect } from "expo-router";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";

const STORE_COLOR = "#FF6584";

function LoadingScreen() {
  const colors = useColors();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={STORE_COLOR} />
    </View>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: STORE_COLOR,
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
        name="products" 
        options={{ 
          title: "منتجاتي", 
          tabBarIcon: ({ color }) => isIOS 
            ? <SymbolView name="bag" tintColor={color} size={22} /> 
            : <Feather name="shopping-bag" size={22} color={color} /> 
        }} 
      />

      <Tabs.Screen 
        name="orders" 
        options={{ 
          title: "الطلبات", 
          tabBarIcon: ({ color }) => isIOS 
            ? <SymbolView name="list.bullet" tintColor={color} size={22} /> 
            : <Feather name="list" size={22} color={color} /> 
        }} 
      />

      <Tabs.Screen 
        name="store-orders" 
        options={{ 
          title: "طلبات الشراء", 
          tabBarIcon: ({ color }) => <Feather name="shopping-cart" size={22} color={color} /> 
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

      {/* ✅ الشاشات المخفية */}
      <Tabs.Screen name="assign-driver" options={{ href: null }} />
      <Tabs.Screen name="order-details" options={{ href: null }} />
      <Tabs.Screen name="add-product" options={{ href: null }} />
      <Tabs.Screen name="edit-product" options={{ href: null }} />
    </Tabs>
  );
}

export default function StoreOwnerLayout() {
  const { user, isLoading } = useAuth();

  // ✅ عرض شاشة التحميل أثناء التحقق
  if (isLoading) {
    return <LoadingScreen />;
  }

  // ✅ استخدام Redirect المباشر - بدون useEffect
  if (!user) {
    return <Redirect href="/role-select" />;
  }

  if (user.role !== "store_owner") {
    return <Redirect href="/" />;
  }

  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});