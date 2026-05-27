// app/index.tsx
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ✅ تبسيط التوجيه - بدون useEffect
  if (!user) {
    return <Redirect href="/role-select" />;
  }

  // ✅ توجيه مباشر حسب الدور
  switch (user.role) {
    case "agent":
      return <Redirect href="/(agent)" />;
    case "driver":
      return <Redirect href="/(driver)" />;
    case "customer":
      return <Redirect href="/(customer)" />;
    case "store_owner":
      return <Redirect href="/(store-owner)" />;
    case "admin":
      return <Redirect href="/(admin)" />;
    default:
      return <Redirect href="/role-select" />;
  }
}