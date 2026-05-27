// app/_layout.tsx
import {
  Cairo_400Regular,
  Cairo_600SemiBold,
  Cairo_700Bold,
  useFonts,
} from "@expo-google-fonts/cairo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { I18nManager, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl } from "@workspace/api-client-react";
import { CartProvider } from "@/context/CartContext";
import { StoreOrderProvider } from "@/context/StoreOrderContext";

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const apiDomain = process.env.EXPO_PUBLIC_DOMAIN;
if (apiDomain) {
  setBaseUrl(`https://${apiDomain}`);
}

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { OrdersProvider } from "@/context/OrdersContext";
import { DriverProvider } from "@/context/DriverContext";
import { AgentProvider } from "@/context/AgentContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import CustomSplashScreen from "./splash"; // ✅ استيراد شاشة التحميل المخصصة

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="role-select" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(driver)" />
      <Stack.Screen name="(agent)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="pending-approval" />
      <Stack.Screen name="new-order" options={{ presentation: "modal" }} />
      <Stack.Screen name="track-order" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Cairo_400Regular,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });
  
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // إخفاء شاشة التحميل المخصصة بعد 3 ثوانٍ
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCustomSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded && !fontError) return null;
  
  // عرض شاشة التحميل المخصصة أولاً
  if (showCustomSplash) {
    return <CustomSplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1, direction: Platform.OS === "web" ? "rtl" : undefined } as any}>
            <KeyboardProvider>
              <AuthProvider>
                <DriverProvider>
                  <AgentProvider>
                    <FavoritesProvider>
                      <CartProvider> 
                        <StoreOrderProvider>
                          <OrdersProvider>
                            <RootLayoutNav />
                          </OrdersProvider>
                        </StoreOrderProvider>
                      </CartProvider>
                    </FavoritesProvider>
                  </AgentProvider>
                </DriverProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}