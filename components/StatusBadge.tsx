import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { OrderStatus } from "@/context/OrdersContext";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  searching:  { label: "يبحث عن سائق",      color: "#FFA63D", bg: "#FFF3E0" },
  bidding:    { label: "عروض متاحة",         color: "#6C63FF", bg: "#EDE7FF" },
  accepted:   { label: "السائق في الطريق",   color: "#17A2B8", bg: "#E1F5FE" },
  picked:     { label: "في الطريق",          color: "#6C63FF", bg: "#EDE7FF" },
  delivered:  { label: "بانتظار التأكيد",    color: "#FF6584", bg: "#FFF0F3" },
  completed:  { label: "مكتمل",              color: "#28A745", bg: "#E8F5E9" },
  cancelled:  { label: "ملغي",              color: "#DC3545", bg: "#FFEBEE" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.cancelled;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: "600" },
});
