import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

const ADMIN_COLOR = "#1E88E5";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>الإحصائيات</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="users">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>المستخدمون</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="orders">
        <Icon sf={{ default: "shippingbox", selected: "shippingbox.fill" }} />
        <Label>الطلبات</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agents">
        <Icon sf={{ default: "briefcase", selected: "briefcase.fill" }} />
        <Label>الوكلاء</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="finance">
        <Icon sf={{ default: "banknote", selected: "banknote.fill" }} />
        <Label>المالية</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ADMIN_COLOR,
        tabBarInactiveTintColor: colors.textGray,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === "web" ? 72 : 60,
          paddingBottom: Platform.OS === "web" ? 12 : 8, paddingTop: Platform.OS === "web" ? 10 : 6,
        },
        tabBarBackground: () => isIOS ? <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} /> : null,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "الإحصائيات", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="chart.bar" tintColor={color} size={22} /> : <Feather name="bar-chart-2" size={22} color={color} /> }} />
      <Tabs.Screen name="users" options={{ title: "المستخدمون", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="person.2" tintColor={color} size={22} /> : <Feather name="users" size={22} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: "الطلبات", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="shippingbox" tintColor={color} size={22} /> : <Feather name="package" size={22} color={color} /> }} />
      <Tabs.Screen name="agents" options={{ title: "الوكلاء", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="briefcase" tintColor={color} size={22} /> : <Feather name="briefcase" size={22} color={color} /> }} />
      <Tabs.Screen name="finance" options={{ title: "المالية", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="banknote" tintColor={color} size={22} /> : <Feather name="dollar-sign" size={22} color={color} /> }} />
    </Tabs>
  );
}

export default function AdminLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
