import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type UserRole =
  | "customer"
  | "driver"
  | "agent"
  | "store_owner"
  | "admin"
  | "support";

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  icon: "home" | "briefcase" | "map-pin" | "star";
}

export type DriverStatus = "pending" | "active" | "suspended";

export interface User {
  id: string;
  fullName: string;
  phone: string;
  role: UserRole;
  neighborhood?: string;
  totalDeliveries?: number;
  rating?: number;
  agentCode?: string;
  isActive: boolean;
  collectedCommission?: number;
  savedAddresses?: SavedAddress[];
  notificationsEnabled?: boolean;
  walletBalance?: number;
  
  // driver-specific
  driverStatus?: DriverStatus;
  idNumber?: string;
  vehicleType?: "car" | "bike" | "truck";
  commissionBalance?: number;
  // kept for non-customer roles
  prepaidBalance?: number;
}

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (phone: string, password: string, role: UserRole) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (u: User) => Promise<void>;
  addSavedAddress: (addr: Omit<SavedAddress, "id">) => void;
  removeSavedAddress: (id: string) => void;
  topUpWallet: (amount: number) => void;
  deductWallet: (amount: number) => boolean;
  deductCommission: () => boolean;
  refundCommission: () => void;
  activateDriverAccount: () => void;
  error: string | null;
  clearError: () => void;
}

export interface RegisterData {
  fullName: string;
  phone: string;
  password: string;
  role: UserRole;
  neighborhood?: string;
  agentCode?: string;
  idNumber?: string;
  vehicleType?: "car" | "bike" | "truck";
}

const DEFAULT_CUSTOMER_ADDRESSES: SavedAddress[] = [
  { id: "addr_home", label: "المنزل", address: "الرمال - شارع الوحدة", icon: "home" },
  { id: "addr_work", label: "العمل", address: "الزيتون - دوار أبو حصيرة", icon: "briefcase" },
];

const DEMO_ACCOUNTS: Record<string, { password: string; user: User }> = {
  "0591234567": {
    password: "123456",
    user: {
      id: "customer_001",
      fullName: "أحمد محمد",
      phone: "0591234567",
      role: "customer",
      neighborhood: "الرمال",
      rating: 4.8,
      isActive: true,
      notificationsEnabled: true,
      savedAddresses: DEFAULT_CUSTOMER_ADDRESSES,
      walletBalance: 50,
    },
  },
  "0597654321": {
    password: "123456",
    user: {
      id: "driver_001",
      fullName: "محمد سعيد",
      phone: "0597654321",
      role: "driver",
      neighborhood: "الشجاعية",
      prepaidBalance: 0,
      totalDeliveries: 312,
      rating: 4.9,
      isActive: true,
      driverStatus: "active",
      vehicleType: "car",
      commissionBalance: 20,
      idNumber: "123456789",
    },
  },
  "0591112222": {
    password: "123456",
    user: {
      id: "agent_001",
      fullName: "بقالة السلام",
      phone: "0591112222",
      role: "agent",
      neighborhood: "الرمال",
      prepaidBalance: 0,
      agentCode: "AGT001",
      collectedCommission: 87.5,
      isActive: true,
    },
  },
  "0591000000": {
    password: "admin123",
    user: {
      id: "admin_001",
      fullName: "مدير النظام",
      phone: "0591000000",
      role: "admin",
      prepaidBalance: 0,
      isActive: true,
    },
  },
  "0592000000": {
    password: "driver123",
    user: {
      id: "driver_002",
      fullName: "عمر سامي",
      phone: "0592000000",
      role: "driver",
      neighborhood: "الزيتون",
      prepaidBalance: 0,
      totalDeliveries: 145,
      rating: 4.7,
      isActive: true,
    },
  },
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const USER_KEY = "@saree_user_v2";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const s = await AsyncStorage.getItem(USER_KEY);
      if (s) setUser(JSON.parse(s));
    } catch {
    } finally { setIsLoading(false); }
  };

  const persist = async (u: User) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const login = useCallback(async (phone: string, password: string, role: UserRole): Promise<boolean> => {
    setError(null);
    await new Promise((r) => setTimeout(r, 700));
    const acc = DEMO_ACCOUNTS[phone];
    if (!acc || acc.password !== password) {
      setError("رقم الهاتف أو كلمة المرور غير صحيحة");
      return false;
    }
    if (acc.user.role !== role) {
      setError("هذا الحساب غير مسجل كـ " + ROLE_LABELS[role]);
      return false;
    }
    await persist(acc.user);
    return true;
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    setError(null);
    await new Promise((r) => setTimeout(r, 700));
    const newUser: User = {
      id: `${data.role}_${Date.now()}`,
      fullName: data.fullName,
      phone: data.phone,
      role: data.role,
      neighborhood: data.neighborhood,
      isActive: true,
      agentCode: data.agentCode,
      collectedCommission: data.role === "agent" ? 0 : undefined,
      savedAddresses: data.role === "customer" ? [] : undefined,
      notificationsEnabled: true,
      ...(data.role === "driver" ? {
        driverStatus: "pending" as const,
        idNumber: data.idNumber,
        vehicleType: data.vehicleType,
        commissionBalance: 0,
        totalDeliveries: 0,
        rating: 0,
      } : {}),
    };
    await persist(newUser);
    return true;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const updateUser = useCallback(async (u: User) => { await persist(u); }, []);

  const addSavedAddress = useCallback((addr: Omit<SavedAddress, "id">) => {
    if (!user) return;
    const newAddr: SavedAddress = { ...addr, id: `addr_${Date.now()}` };
    persist({ ...user, savedAddresses: [...(user.savedAddresses ?? []), newAddr] });
  }, [user]);

  const removeSavedAddress = useCallback((id: string) => {
    if (!user) return;
    persist({ ...user, savedAddresses: (user.savedAddresses ?? []).filter((a) => a.id !== id) });
  }, [user]);

  const topUpWallet = useCallback((amount: number) => {
    if (!user) return;
    persist({ ...user, walletBalance: (user.walletBalance ?? 0) + amount });
  }, [user]);

  const deductWallet = useCallback((amount: number): boolean => {
    if (!user) return false;
    const balance = user.walletBalance ?? 0;
    if (balance < amount) return false;
    persist({ ...user, walletBalance: balance - amount });
    return true;
  }, [user]);

  const deductCommission = useCallback((): boolean => {
    if (!user) return false;
    const bal = user.commissionBalance ?? 0;
    if (bal < 1) return false;
    persist({ ...user, commissionBalance: bal - 1, totalDeliveries: (user.totalDeliveries ?? 0) + 1 });
    return true;
  }, [user]);

  const refundCommission = useCallback(() => {
    if (!user) return;
    persist({ ...user, commissionBalance: (user.commissionBalance ?? 0) + 1, totalDeliveries: Math.max(0, (user.totalDeliveries ?? 1) - 1) });
  }, [user]);

  const activateDriverAccount = useCallback(() => {
    if (!user) return;
    persist({ ...user, driverStatus: "active", commissionBalance: (user.commissionBalance ?? 0) + 20 });
  }, [user]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{
      user, isLoggedIn: !!user, isLoading,
      login, register, logout, updateUser,
      addSavedAddress, removeSavedAddress,
      topUpWallet, deductWallet,
      deductCommission, refundCommission, activateDriverAccount,
      error, clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

const ROLE_LABELS: Record<UserRole, string> = {
  customer: "عميل", driver: "سائق", agent: "وكيل",
  store_owner: "صاحب متجر", admin: "مدير", support: "دعم فني",
};
