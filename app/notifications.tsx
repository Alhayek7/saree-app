import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { 
  FlatList, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  RefreshControl 
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";

interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  timestamp: number;
  icon: "check-circle" | "credit-card" | "flag" | "gift" | "bell" | "star" | "navigation" | "truck";
  color: string;
  read: boolean;
  type: "order" | "payment" | "favorite" | "system";
  orderId?: string;
}

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { getMyOrders } = useOrders();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // توليد إشعارات حية بناءً على نشاط المستخدم
  const generateRealNotifications = () => {
    const orders = getMyOrders(user?.id || "");
    const recentOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt).getTime();
      const now = Date.now();
      return now - orderDate < 7 * 24 * 60 * 60 * 1000; // آخر 7 أيام
    });

    const newNotifications: Notification[] = [];

    // إشعارات الطلبات
    recentOrders.forEach((order, index) => {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60));
      let timeText = "";
      if (diffMinutes < 1) timeText = "الآن";
      else if (diffMinutes < 60) timeText = `منذ ${diffMinutes} دقيقة`;
      else if (diffMinutes < 1440) timeText = `منذ ${Math.floor(diffMinutes / 60)} ساعة`;
      else timeText = `منذ ${Math.floor(diffMinutes / 1440)} يوم`;

      if (order.status === "accepted") {
        newNotifications.push({
          id: `order_accepted_${order.id}`,
          title: "✅ تم قبول طلبك",
          body: `السائق ${order.selectedOffer?.driverName || "سائق"} في الطريق لاستلام طردك`,
          time: timeText,
          timestamp: orderDate.getTime(),
          icon: "check-circle",
          color: "#28A745",
          read: false,
          type: "order",
          orderId: order.id,
        });
      } else if (order.status === "delivered") {
        newNotifications.push({
          id: `order_delivered_${order.id}`,
          title: "📦 تم التوصيل",
          body: `طلبك #${order.id} تم تسليمه بنجاح`,
          time: timeText,
          timestamp: orderDate.getTime(),
          icon: "flag",
          color: "#6C63FF",
          read: false,
          type: "order",
          orderId: order.id,
        });
      } else if (order.status === "picked") {
        newNotifications.push({
          id: `order_picked_${order.id}`,
          title: "🚚 تم استلام طردك",
          body: `السائق ${order.selectedOffer?.driverName || "سائق"} استلم طردك ويتجه إليك`,
          time: timeText,
          timestamp: orderDate.getTime(),
          icon: "truck",
          color: "#FFA63D",
          read: false,
          type: "order",
          orderId: order.id,
        });
      }
    });

    // إشعارات ترحيبية إذا كان جديداً
    if (newNotifications.length === 0) {
      newNotifications.push({
        id: "welcome",
        title: "👋 مرحباً بك في سريع",
        body: "ابدأ بطلبك الأول الآن واستمتع بتجربة توصيل سريعة",
        time: "الآن",
        timestamp: Date.now(),
        icon: "bell",
        color: colors.primary,
        read: false,
        type: "system",
      });
    }

    // ترتيب من الأحدث للأقدم
    newNotifications.sort((a, b) => b.timestamp - a.timestamp);
    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter(n => !n.read).length);
  };

  useEffect(() => {
    generateRealNotifications();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    generateRealNotifications();
    setTimeout(() => setRefreshing(false), 500);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.orderId) {
      router.push({ pathname: "/track-order", params: { orderId: notification.orderId } });
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "الآن";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return new Date(timestamp).toLocaleDateString("ar");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: 50, paddingBottom: 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>الإشعارات</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={[styles.markAllText, { color: colors.primary, fontSize: 12 }]}>
            تحديد الكل كمقروء
          </Text>
        </TouchableOpacity>
      </View>

      {unreadCount > 0 && (
        <View style={[styles.unreadBar, { backgroundColor: colors.primary + "15" }]}>
          <Feather name="bell" size={14} color={colors.primary} />
          <Text style={[styles.unreadText, { color: colors.primary }]}>
            لديك {unreadCount} إشعار غير مقروء
          </Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="bell-off" size={48} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textGray }]}>لا توجد إشعارات حالياً</Text>
            <Text style={[styles.emptySub, { color: colors.textLight }]}>
              ستظهر هنا إشعارات الطلبات والتحديثات
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleNotificationPress(item)}
            style={[
              styles.card,
              {
                backgroundColor: item.read ? colors.card : colors.primary + "08",
                borderColor: item.read ? colors.border : colors.primary + "40",
                borderWidth: item.read ? 1 : 1.5,
              },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: item.color + "18" }]}>
              <Feather name={item.icon} size={22} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.notifHeader}>
                <Text style={[styles.notifTitle, { color: colors.foreground, fontWeight: item.read ? "600" : "700" }]}>
                  {item.title}
                </Text>
                {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
              </View>
              <Text style={[styles.notifBody, { color: colors.textGray }]}>{item.body}</Text>
              <Text style={[styles.notifTime, { color: colors.textLight }]}>{formatTime(item.timestamp)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1, 
    gap: 12 
  },
  title: { flex: 1, fontSize: 17, fontWeight: "700", textAlign: "center" },
  markAllText: { fontSize: 12, fontWeight: "500" },
  unreadBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  unreadText: { fontSize: 12, fontWeight: "500" },
  card: { 
    flexDirection: "row", 
    alignItems: "flex-start", 
    gap: 14, 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1 
  },
  iconBox: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  notifHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    marginBottom: 4 
  },
  notifTitle: { fontSize: 15, fontWeight: "700" },
  notifBody: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  emptyContainer: { alignItems: "center", justifyContent: "center", padding: 48, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  emptySub: { fontSize: 13, textAlign: "center" },
});