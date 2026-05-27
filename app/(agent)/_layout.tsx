// app/(agent)/_layout.tsx
import { Feather } from "@expo/vector-icons";
import { Tabs, Redirect } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const AGENT_COLOR = "#9C27B0";

const TABS = [
  { name: "index", title: "الرئيسية", icon: "home" },
  { name: "sell", title: "بيع", icon: "shopping-cart" },
  { name: "recharge", title: "شحن", icon: "refresh-cw" },
  { name: "commissions", title: "عمولاتي", icon: "trending-up" },
  { name: "profile", title: "حسابي", icon: "user" },
];

function LoadingScreen() {
  const colors = useColors();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={AGENT_COLOR} />
    </View>
  );
}

function TabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AGENT_COLOR,
        tabBarInactiveTintColor: "#999",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#E5E5E5",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => (
              <Feather name={tab.icon as any} size={22} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

export default function AgentLayout() {
  const { user, isLoading } = useAuth();

  // ✅ عرض شاشة التحميل أثناء التحقق
  if (isLoading) {
    return <LoadingScreen />;
  }

  // ✅ استخدام Redirect المباشر - لا يحتاج useEffect
  if (!user) {
    return <Redirect href="/role-select" />;
  }

  if (user.role !== "agent") {
    return <Redirect href="/" />;
  }

  return <TabLayout />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});