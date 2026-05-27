// app/favorites-list.tsx
import { useFavorites } from "@/context/FavoritesContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FavoritesListScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { favorites, removeFavorite } = useFavorites();

  if (!favorites) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textGray }}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (favorites.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Feather name="heart" size={48} color={colors.textLight} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            لا توجد سائقين مفضلين
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textGray }]}>
            يمكنك إضافة سائقين مفضلين من قائمة السائقين
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardContent}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {item.name?.charAt(0) || "س"}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.rating, { color: colors.textGray }]}>
                  ⭐ {item.rating} • {item.completedOrdersWithMe} توصيلة
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeFavorite(item.id)}>
                <Feather name="trash-2" size={20} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  listContainer: { padding: 16, gap: 12 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "bold" },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600" },
  rating: { fontSize: 12, marginTop: 2 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
});