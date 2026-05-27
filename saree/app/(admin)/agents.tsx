import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  getListAgentsQueryKey,
  getListAgentsQueryOptions,
  useCreateAgent,
  useDeleteAgent,
} from "@workspace/api-client-react";
import type { AgentRecord } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const ADMIN_COLOR = "#1E88E5";
const AGENT_COLOR = "#9C27B0";

export default function AdminAgentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const queryClient = useQueryClient();

  const { data: agents, isLoading } = useQuery(getListAgentsQueryOptions() as any);
  const agentList: AgentRecord[] = (agents as AgentRecord[]) ?? [];

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [formError, setFormError] = useState("");

  const createAgent = useCreateAgent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAgentsQueryKey() });
        setShowForm(false);
        setForm({ name: "", phone: "", address: "" });
        setFormError("");
      },
      onError: (err: any) => {
        setFormError(err?.message ?? "حدث خطأ");
      },
    },
  });

  const deleteAgent = useDeleteAgent({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAgentsQueryKey() }),
    },
  });

  const handleSubmit = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setFormError("يرجى ملء جميع الحقول");
      return;
    }
    setFormError("");
    createAgent.mutate({ data: { name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim() } });
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert("حذف الوكيل", `هل تريد حذف ${name} نهائياً؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => deleteAgent.mutate({ id }) },
    ]);
  };

  const totalSalesAll = agentList.reduce((sum, a) => sum + (a.totalSales ?? 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: ADMIN_COLOR, paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>إدارة الوكلاء</Text>
            <Text style={styles.subtitle}>{agentList.length} وكيل · إجمالي المبيعات: {totalSalesAll} ₪</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={agentList}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: Platform.OS === "web" ? 34 : 100 }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={isLoading ? <ActivityIndicator color={ADMIN_COLOR} style={{ marginTop: 20 }} /> : null}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ alignItems: "center", marginTop: 60, gap: 12 }}>
              <Feather name="briefcase" size={48} color={colors.border} />
              <Text style={{ color: colors.textGray, fontSize: 15 }}>لا يوجد وكلاء بعد</Text>
              <TouchableOpacity style={[styles.addBtn, { paddingHorizontal: 20 }]} onPress={() => setShowForm(true)}>
                <Feather name="plus" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>إضافة وكيل</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardRow}>
              <View style={[styles.avatar, { backgroundColor: AGENT_COLOR + "20" }]}>
                <Text style={[styles.avatarText, { color: AGENT_COLOR }]}>{item.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.sub, { color: colors.textGray }]}>{item.phone}</Text>
                <Text style={[styles.sub, { color: colors.textLight }]}>{item.address}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 6 }}>
                <View style={[styles.badge, { backgroundColor: (item.isActive ? "#28A745" : "#DC3545") + "20" }]}>
                  <Text style={{ color: item.isActive ? "#28A745" : "#DC3545", fontSize: 11, fontWeight: "700" }}>
                    {item.isActive ? "نشط" : "غير نشط"}
                  </Text>
                </View>
                <Text style={{ color: AGENT_COLOR, fontSize: 13, fontWeight: "700" }}>{item.totalSales ?? 0} ₪</Text>
                <Text style={{ color: colors.textGray, fontSize: 10 }}>إجمالي المبيعات</Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#FFEBEE", borderColor: "#DC3545" }]}
                onPress={() => handleDelete(item.id, item.name)}
              >
                <Feather name="trash-2" size={13} color="#DC3545" />
                <Text style={{ color: "#DC3545", fontSize: 12, fontWeight: "700" }}>حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>إضافة وكيل جديد</Text>
              <TouchableOpacity onPress={() => { setShowForm(false); setFormError(""); }}>
                <Feather name="x" size={22} color={colors.textGray} />
              </TouchableOpacity>
            </View>
            {(["name", "phone", "address"] as const).map((field) => (
              <View key={field} style={{ gap: 4 }}>
                <Text style={{ color: colors.textGray, fontSize: 13 }}>
                  {field === "name" ? "الاسم" : field === "phone" ? "رقم الهاتف" : "العنوان"}
                </Text>
                <TextInput
                  value={form[field]}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, [field]: v }))}
                  placeholder={field === "name" ? "اسم الوكيل" : field === "phone" ? "059xxxxxxx" : "المنطقة - الشارع"}
                  placeholderTextColor={colors.textGray}
                  keyboardType={field === "phone" ? "phone-pad" : "default"}
                  style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                />
              </View>
            ))}
            {formError !== "" && <Text style={{ color: "#DC3545", fontSize: 13 }}>{formError}</Text>}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: ADMIN_COLOR, opacity: createAgent.isPending ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={createAgent.isPending}
            >
              {createAgent.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>إضافة الوكيل</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, fontWeight: "700" },
  name: { fontSize: 14, fontWeight: "700" },
  sub: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  cardActions: { flexDirection: "row", justifyContent: "flex-end", padding: 12, paddingTop: 0 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  submitBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 4 },
});
