// app/(customer)/_layout.tsx
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View, Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useCart } from "@/context/CartContext";

export default function CustomerLayout() {
  const colors = useColors();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const { getTotalItems } = useCart();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/role-select" as any);
    }
  }, [isLoggedIn]);

  const isIOS = Platform.OS === "ios";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textGray,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: Platform.OS === "web" ? 0 : 0.5,
          borderTopColor: colors.border,
          elevation: 0,
          height: Platform.OS === "web" ? 72 : 62,
          paddingBottom: Platform.OS === "web" ? 12 : 8,
          paddingTop: Platform.OS === "web" ? 10 : 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
          ) : null,
      }}
    >
      {/* التبويب 1: الرئيسية */}
      <Tabs.Screen
        name="index"
        options={{
          title: "الرئيسية",
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />

      {/* التبويب 2: طلباتي */}
      <Tabs.Screen
        name="orders"
        options={{
          title: "طلباتي",
          tabBarIcon: ({ color, size }) => <Feather name="package" size={size} color={color} />,
        }}
      />

      {/* التبويب 3: منتجات */}
      <Tabs.Screen
        name="store-products"
        options={{
          title: "منتجات",
          tabBarIcon: ({ color, size }) => <Feather name="shopping-bag" size={size} color={color} />,
        }}
      />

      {/* التبويب 4: السلة */}
      <Tabs.Screen
        name="cart"
        options={{
          title: "السلة",
          tabBarIcon: ({ color, size }) => (
            <View style={styles.cartIconContainer}>
              <Feather name="shopping-cart" size={size} color={color} />
              {getTotalItems > 0 && (
                <View style={[styles.cartBadge, { backgroundColor: colors.destructive }]}>
                  <Text style={styles.cartBadgeText}>{getTotalItems > 99 ? "99+" : getTotalItems}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      {/* التبويب 5: حسابي */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "حسابي",
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  cartIconContainer: {
    position: "relative",
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -8,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});