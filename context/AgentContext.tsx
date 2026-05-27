// context/AgentContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

export interface AgentPackage {
  id: number;
  orders: number;
  price: number;
  commission: number;
  label: string;
}

export const AGENT_PACKAGES: AgentPackage[] = [
  { id: 1, orders: 5,  price: 25,  commission: 1.25, label: "باقة المبتدئ" },
  { id: 2, orders: 10, price: 45,  commission: 2.5,  label: "الباقة الأكثر طلباً" },
  { id: 3, orders: 20, price: 80,  commission: 5,    label: "الباقة الموفّرة" },
  { id: 4, orders: 50, price: 175, commission: 12.5, label: "الباقة الذهبية" },
];

export interface AgentCode {
  id: string;
  code: string;
  packageId: number;
  packageOrders: number;
  used: boolean;
  usedByPhone?: string;
  createdAt: number;
  usedAt?: number;
}

export interface AgentSale {
  id: string;
  packageId: number;
  packageOrders: number;
  price: number;
  commission: number;
  customerPhone: string;
  codeId?: string;
  createdAt: number;
}

export type WithdrawMethod = "cash" | "wallet" | "bank";
export type WithdrawStatus = "pending" | "paid" | "rejected";

export interface AgentWithdraw {
  id: string;
  amount: number;
  method: WithdrawMethod;
  status: WithdrawStatus;
  createdAt: number;
  note?: string;
}

// ==================== إضافات نظام الشحن ====================

export interface RechargeRequest {
  id: string;
  agentId: string;
  agentName: string;
  requestedAmount: number;      // عدد الطلبات المطلوبة
  paidAmount: number;           // المبلغ المدفوع (عدد الطلبات - 20%)
  imageUri: string;              // صورة إشعار الدفع
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  reviewedAt?: number;
  rejectionReason?: string;
}

export interface AgentBalance {
  agentId: string;
  availableOrders: number;       // عدد الطلبات المتاحة للبيع
  totalRecharged: number;        // إجمالي ما تم شحنه
  totalSold: number;             // إجمالي ما تم بيعه
  lastRechargeAt?: number;
}

// ==================== واجهة Context ====================

interface AgentContextValue {
  codes: AgentCode[];
  sales: AgentSale[];
  withdrawals: AgentWithdraw[];
  balance: AgentBalance;
  rechargeRequests: RechargeRequest[];
  isLoading: boolean;
  /* actions existing */
  generateCode: (packageId: number) => Promise<AgentCode>;
  deleteCode: (id: string) => Promise<void>;
  sellPackage: (packageId: number, customerPhone: string) => Promise<{ sale: AgentSale; code: AgentCode }>;
  requestWithdraw: (amount: number, method: WithdrawMethod) => Promise<AgentWithdraw>;
  /* new actions - نظام الشحن */
  getBalance: () => AgentBalance;
  rechargeBalance: (amount: number, imageUri: string) => Promise<RechargeRequest>;
  sellToCustomer: (customerPhone: string, ordersCount: number) => Promise<{ success: boolean; message: string; customerName?: string }>;
  getCustomerByPhone: (phone: string) => Promise<{ name: string; phone: string } | null>;
  checkLowBalance: () => boolean;
  approveRechargeRequest: (requestId: string) => Promise<boolean>;
  updateBalance: (newBalance: AgentBalance) => Promise<void>; // ✅ أضف هذا السطر
  rejectRechargeRequest: (requestId: string, reason?: string) => Promise<boolean>;

  /* computed */
  stats: {
    totalCodes: number;
    availableCodes: number;
    usedCodes: number;
    totalSales: number;
    totalCommission: number;
    paidCommission: number;
    pendingCommission: number;
    availableCommission: number;
  };
}

// ==================== مفاتيح التخزين ====================

const CODES_KEY = "@saree_agent_codes_v1";
const SALES_KEY = "@saree_agent_sales_v1";
const WITHDRAWS_KEY = "@saree_agent_withdraws_v1";
const BALANCE_KEY = "@saree_agent_balance_v1";
const RECHARGE_REQUESTS_KEY = "@saree_agent_recharge_requests_v1";

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

function randomCode(prefix = "AGT001"): string {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${seg()}-${seg()}`;
}

// بيانات تجريبية للعملاء
const MOCK_CUSTOMERS: Record<string, { name: string; phone: string }> = {
  '0591234567': { name: 'أحمد محمد', phone: '0591234567' },
  '0597654321': { name: 'محمد سعيد', phone: '0597654321' },
  '0598887777': { name: 'متجر الأمل', phone: '0598887777' },
  '0591112222': { name: 'بقالة السلام', phone: '0591112222' },
  '0591000000': { name: 'مدير النظام', phone: '0591000000' },
};

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useAuth();
  const [codes, setCodes] = useState<AgentCode[]>([]);
  const [sales, setSales] = useState<AgentSale[]>([]);
  const [withdrawals, setWithdrawals] = useState<AgentWithdraw[]>([]);
  const [balance, setBalance] = useState<AgentBalance>({
    agentId: user?.id || '',
    availableOrders: 200,
    totalRecharged: 200,
    totalSold: 0,
  });
  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ── load ── */
  useEffect(() => {
    (async () => {
      try {
        const [c, s, w, b, r] = await Promise.all([
          AsyncStorage.getItem(CODES_KEY),
          AsyncStorage.getItem(SALES_KEY),
          AsyncStorage.getItem(WITHDRAWS_KEY),
          AsyncStorage.getItem(BALANCE_KEY),
          AsyncStorage.getItem(RECHARGE_REQUESTS_KEY),
        ]);
        if (c) setCodes(JSON.parse(c));
        if (s) setSales(JSON.parse(s));
        if (w) setWithdrawals(JSON.parse(w));
        if (b) setBalance(JSON.parse(b));
        if (r) setRechargeRequests(JSON.parse(r));
      } catch {}
      finally { setIsLoading(false); }
    })();
  }, []);

  /* ── persistence helpers ── */
  const persistCodes = useCallback(async (next: AgentCode[]) => {
    setCodes(next);
    await AsyncStorage.setItem(CODES_KEY, JSON.stringify(next));
  }, []);
  
  const persistSales = useCallback(async (next: AgentSale[]) => {
    setSales(next);
    await AsyncStorage.setItem(SALES_KEY, JSON.stringify(next));
  }, []);
  
  const persistWithdraws = useCallback(async (next: AgentWithdraw[]) => {
    setWithdrawals(next);
    await AsyncStorage.setItem(WITHDRAWS_KEY, JSON.stringify(next));
  }, []);
  
  const persistBalance = useCallback(async (next: AgentBalance) => {
    setBalance(next);
    await AsyncStorage.setItem(BALANCE_KEY, JSON.stringify(next));
  }, []);
  
  const persistRechargeRequests = useCallback(async (next: RechargeRequest[]) => {
    setRechargeRequests(next);
    await AsyncStorage.setItem(RECHARGE_REQUESTS_KEY, JSON.stringify(next));
  }, []);

  /* ── actions existing ── */
  const generateCode = useCallback(async (packageId: number): Promise<AgentCode> => {
    const pkg = AGENT_PACKAGES.find(p => p.id === packageId) ?? AGENT_PACKAGES[1];
    const newCode: AgentCode = {
      id: Date.now().toString(),
      code: randomCode(user?.agentCode ?? "AGT001"),
      packageId: pkg.id,
      packageOrders: pkg.orders,
      used: false,
      createdAt: Date.now(),
    };
    await persistCodes([newCode, ...codes]);
    return newCode;
  }, [codes, persistCodes, user?.agentCode]);

  const deleteCode = useCallback(async (id: string) => {
    await persistCodes(codes.filter(c => c.id !== id));
  }, [codes, persistCodes]);

  const sellPackage = useCallback(async (packageId: number, customerPhone: string) => {
    const pkg = AGENT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) throw new Error("Package not found");

    const code: AgentCode = {
      id: `${Date.now()}_c`,
      code: randomCode(user?.agentCode ?? "AGT001"),
      packageId: pkg.id,
      packageOrders: pkg.orders,
      used: true,
      usedByPhone: customerPhone,
      createdAt: Date.now(),
      usedAt: Date.now(),
    };
    
    const sale: AgentSale = {
      id: `${Date.now()}_s`,
      packageId: pkg.id,
      packageOrders: pkg.orders,
      price: pkg.price,
      commission: pkg.commission,
      customerPhone,
      codeId: code.id,
      createdAt: Date.now(),
    };
    
    await persistCodes([code, ...codes]);
    await persistSales([sale, ...sales]);
    
    if (user) {
      await updateUser({ ...user, collectedCommission: (user.collectedCommission ?? 0) + pkg.commission });
    }
    return { sale, code };
  }, [codes, sales, persistCodes, persistSales, user, updateUser]);

  const requestWithdraw = useCallback(async (amount: number, method: WithdrawMethod) => {
    const w: AgentWithdraw = {
      id: Date.now().toString(),
      amount,
      method,
      status: "pending",
      createdAt: Date.now(),
    };
    await persistWithdraws([w, ...withdrawals]);
    return w;
  }, [withdrawals, persistWithdraws]);

  /* ── new actions - نظام الشحن ── */
  
  // طلب شحن رصيد من الأدمن
  const rechargeBalance = useCallback(async (amount: number, imageUri: string): Promise<RechargeRequest> => {
    const paidAmount = amount - (amount * 0.2); // خصم 20%
    
    const newRequest: RechargeRequest = {
      id: `RECH_${Date.now()}`,
      agentId: user!.id,
      agentName: user!.fullName,
      requestedAmount: amount,
      paidAmount: paidAmount,
      imageUri: imageUri,
      status: 'pending',
      createdAt: Date.now(),
    };
    
    await persistRechargeRequests([newRequest, ...rechargeRequests]);
    return newRequest;
  }, [user, rechargeRequests, persistRechargeRequests]);

  // الحصول على الرصيد الحالي
  const getBalance = useCallback(() => balance, [balance]);

  // بيع رصيد لعميل (سائق أو متجر)
  const sellToCustomer = useCallback(async (customerPhone: string, ordersCount: number) => {
    if (balance.availableOrders < ordersCount) {
      return { success: false, message: `رصيد غير كافٍ! المتاح: ${balance.availableOrders} طلب، يرجى شحن الرصيد أولاً` };
    }
    
    const customer = await getCustomerByPhone(customerPhone);
    
    if (!customer) {
      return { success: false, message: 'رقم الجوال غير مسجل في النظام' };
    }
    
    // تحديث رصيد الوكيل
    const newBalance: AgentBalance = {
      ...balance,
      availableOrders: balance.availableOrders - ordersCount,
      totalSold: balance.totalSold + ordersCount,
    };
    await persistBalance(newBalance);
    
    // تسجيل عملية البيع
    const saleRecord: AgentSale = {
      id: `${Date.now()}_sell`,
      packageId: 0,
      packageOrders: ordersCount,
      price: 0,
      commission: 0,
      customerPhone,
      createdAt: Date.now(),
    };
    await persistSales([saleRecord, ...sales]);
    
    return { 
      success: true, 
      message: `تم شحن ${ordersCount} طلب بنجاح للعميل ${customer.name}`,
      customerName: customer.name 
    };
  }, [balance, sales, persistBalance, persistSales]);

  // البحث عن عميل برقم الجوال
  const getCustomerByPhone = useCallback(async (phone: string) => {
    // محاكاة تأخير الشبكة
    await new Promise(r => setTimeout(r, 300));
    return MOCK_CUSTOMERS[phone] || null;
  }, []);

  // التحقق من الرصيد المنخفض
  const checkLowBalance = useCallback(() => {
    return balance.availableOrders <= 10;
  }, [balance.availableOrders]);

  /* ── approval function (للاستخدام من قبل الأدمن) ── */
  const approveRechargeRequest = useCallback(async (requestId: string) => {
    const request = rechargeRequests.find(r => r.id === requestId);
    if (!request) return false;
    
    // تحديث حالة الطلب
    const updatedRequests = rechargeRequests.map(r => 
      r.id === requestId 
        ? { ...r, status: 'approved' as const, reviewedAt: Date.now() }
        : r
    );
    await persistRechargeRequests(updatedRequests);
    
    // إضافة الرصيد للوكيل
    const newBalance: AgentBalance = {
      ...balance,
      availableOrders: balance.availableOrders + request.requestedAmount,
      totalRecharged: balance.totalRecharged + request.requestedAmount,
      lastRechargeAt: Date.now(),
    };
    await persistBalance(newBalance);
    
    return true;
  }, [rechargeRequests, balance, persistRechargeRequests, persistBalance]);


  const rejectRechargeRequest = useCallback(async (requestId: string, reason?: string) => {
  const request = rechargeRequests.find(r => r.id === requestId);
  if (!request) return false;
  
  const updatedRequests = rechargeRequests.map(r => 
    r.id === requestId 
      ? { ...r, status: 'rejected' as const, reviewedAt: Date.now(), rejectionReason: reason || "تم الرفض من قبل الإدارة" }
      : r
  );
  await persistRechargeRequests(updatedRequests);
  return true;
}, [rechargeRequests, persistRechargeRequests]);

/* ── stats ── */
const stats = useMemo(() => {
  const totalCommission = sales.reduce((s, x) => s + x.commission, 0);
  const paid = withdrawals.filter(w => w.status === "paid").reduce((s, x) => s + x.amount, 0);
  const pending = withdrawals.filter(w => w.status === "pending").reduce((s, x) => s + x.amount, 0);
  return {
    totalCodes: codes.length,
    availableCodes: codes.filter(c => !c.used).length,
    usedCodes: codes.filter(c => c.used).length,
    totalSales: sales.length,
    totalCommission,
    paidCommission: paid,
    pendingCommission: pending,
    availableCommission: Math.max(0, totalCommission - paid - pending),
  };
}, [codes, sales, withdrawals]);

// ✅ دالة تحديث الرصيد
const updateBalance = useCallback(async (newBalance: AgentBalance) => {
  setBalance(newBalance);
  await AsyncStorage.setItem(BALANCE_KEY, JSON.stringify(newBalance));
}, []);

// ✅ تعريف value قبل return
const value: AgentContextValue = {
  codes,
  sales,
  withdrawals,
  balance,
  rechargeRequests,
  isLoading,
  generateCode,
  deleteCode,
  sellPackage,
  requestWithdraw,
  rechargeBalance,
  getBalance,
  sellToCustomer,
  getCustomerByPhone,
  checkLowBalance,
  approveRechargeRequest,
  updateBalance,
  rejectRechargeRequest, // ✅ أضف هذا
  stats,
};

return (
  <AgentContext.Provider value={value}>
    {children}
  </AgentContext.Provider>
);
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used within AgentProvider");
  return ctx;
}