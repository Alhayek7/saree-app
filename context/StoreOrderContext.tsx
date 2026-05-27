// context/StoreOrderContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== استيراد الصور المحلية ====================
const proof1 = require('../assets/proofs/proof1.jpeg');
const proof2 = require('../assets/proofs/proof2.jpeg');
const proof3 = require('../assets/proofs/proof13.jpeg'); 

// ==================== أولاً: تعريف الواجهات (Interfaces) ====================

export interface PaymentProof {
  id: string;
  imageUri: any;
  uploadedAt: number;
}

export interface StoreOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface StoreOrder {
  id: string;
  storeId: string;
  storeName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: StoreOrderItem[];
  totalPrice: number;
  status: 'pending_payment' | 'payment_review' | 'accepted' | 'rejected' | 'delivered' | 'driver_rejected' | 'driver_accepted';
  paymentProof?: PaymentProof;
  rejectionReason?: string;
  acceptedAt?: number;
  createdAt: number;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  estimatedMinutes?: number;
  vehicleType?: string;
}

// ==================== ثانياً: البيانات التجريبية ====================

const MOCK_STORE_ORDERS: StoreOrder[] = [
  {
    id: "SO_001",
    storeId: "store_owner_001",
    storeName: "متجر الأمل",
    customerId: "customer_001",
    customerName: "أحمد محمد",
    customerPhone: "0591234567",
    deliveryAddress: "غزة، شارع الرشيد، بناية 10، شقة 3",
    items: [
      { productId: "prod_1", name: "هاتف Samsung", price: 1500, quantity: 1, image: undefined },
      { productId: "prod_2", name: "شاحن سريع", price: 50, quantity: 2, image: undefined },
    ],
    totalPrice: 1600,
    status: "payment_review",
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    paymentProof: { id: "proof_001", imageUri: proof1, uploadedAt: Date.now() - 2 * 60 * 60 * 1000 },
  },
  {
    id: "SO_002",
    storeId: "store_owner_001",
    storeName: "متجر الأمل",
    customerId: "customer_002",
    customerName: "سارة علي",
    customerPhone: "0597654321",
    deliveryAddress: "غزة، تل الهوا، شارع الجلاء، عمارة 5",
    items: [
      { productId: "prod_3", name: "لابتوب Dell", price: 3500, quantity: 1, image: undefined },
      { productId: "prod_4", name: "ماوس لاسلكي", price: 80, quantity: 1, image: undefined },
    ],
    totalPrice: 3580,
    status: "pending_payment",
    createdAt: Date.now() - 5 * 60 * 60 * 1000,
    paymentProof: undefined,
  },
  {
    id: "SO_003",
    storeId: "store_owner_001",
    storeName: "متجر الأمل",
    customerId: "customer_003",
    customerName: "محمد خالد",
    customerPhone: "0591112222",
    deliveryAddress: "غزة، النصر، شارع عمر المختار، مجمع تجاري",
    items: [
      { productId: "prod_5", name: "سماعة بلوتوث", price: 120, quantity: 2, image: undefined },
    ],
    totalPrice: 240,
    status: "accepted",
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
    paymentProof: { id: "proof_002", imageUri: proof2, uploadedAt: Date.now() - 24 * 60 * 60 * 1000 },
    acceptedAt: Date.now() - 23 * 60 * 60 * 1000,
  },
  {
    id: "SO_004",
    storeId: "store_owner_001",
    storeName: "متجر الأمل",
    customerId: "customer_004",
    customerName: "نور إبراهيم",
    customerPhone: "0595556666",
    deliveryAddress: "غزة، الشاطئ، مخيم الشاطئ، شارع 8",
    items: [
      { productId: "prod_1", name: "هاتف Samsung", price: 1500, quantity: 1, image: undefined },
    ],
    totalPrice: 1500,
    status: "rejected",
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    paymentProof: undefined,
    rejectionReason: "لم يتم استلام المبلغ",
  },
  {
    id: "SO_005",
    storeId: "store_owner_001",
    storeName: "متجر الأمل",
    customerId: "customer_005",
    customerName: "عمر وائل",
    customerPhone: "0597778888",
    deliveryAddress: "غزة، الرمال، شارع الثورة، بناية 20",
    items: [
      { productId: "prod_6", name: "ساعة ذكية", price: 450, quantity: 1, image: undefined },
      { productId: "prod_7", name: "حافظة جلد", price: 60, quantity: 1, image: undefined },
    ],
    totalPrice: 510,
    status: "delivered",
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    paymentProof: { id: "proof_003", imageUri: proof3, uploadedAt: Date.now() - 3 * 24 * 60 * 60 * 1000 },
    acceptedAt: Date.now() - 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
  },
];

// ==================== ثالثاً: الـ Context ====================

interface StoreOrderContextType {
  orders: StoreOrder[];
  createOrder: (order: Omit<StoreOrder, 'id' | 'createdAt' | 'status'>) => StoreOrder;
  updateOrderStatus: (orderId: string, status: StoreOrder['status'], data?: any) => void;
  addPaymentProof: (orderId: string, imageUri: string) => void;
  getStoreOrders: (storeId: string) => StoreOrder[];
  getCustomerOrders: (customerId: string) => StoreOrder[];
  getOrderById: (orderId: string) => StoreOrder | undefined;
  rejectOrderByDriver: (orderId: string, driverId: string, reason?: string) => void;
  updateOrderByDriver: (orderId: string, driverId: string, action: 'accept' | 'reject', reason?: string) => void;
}

const StoreOrderContext = createContext<StoreOrderContextType | undefined>(undefined);
const STORAGE_KEY = '@store_orders';

export function StoreOrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<StoreOrder[]>(MOCK_STORE_ORDERS);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedOrders = JSON.parse(stored);
        if (parsedOrders.length > 0) {
          console.log("تم تحميل طلبات مخزنة:", parsedOrders.length);
          setOrders(parsedOrders);
        }
      }
    } catch (error) {
      console.error('Error loading store orders:', error);
    }
  };

  const saveOrders = (newOrders: StoreOrder[]) => {
    setOrders(newOrders);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders)).catch(console.error);
  };

  const createOrder = (orderData: Omit<StoreOrder, 'id' | 'createdAt' | 'status'>): StoreOrder => {
    const newOrder: StoreOrder = {
      ...orderData,
      id: `SO_${Date.now()}`,
      status: 'pending_payment',
      createdAt: Date.now(),
    };
    saveOrders([newOrder, ...orders]);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: StoreOrder['status'], data?: any) => {
    const newOrders = orders.map(order =>
      order.id === orderId
        ? { 
            ...order, 
            status: status, 
            ...(status === 'accepted' && { acceptedAt: Date.now() }),
            ...(status === 'rejected' && { rejectionReason: data?.reason }),
            ...(status === 'accepted' && data?.driverInfo && { 
              driverId: data.driverInfo.driverId,
              driverName: data.driverInfo.driverName,
              driverPhone: data.driverInfo.driverPhone,
              estimatedMinutes: data.driverInfo.estimatedMinutes,
              vehicleType: data.driverInfo.vehicleType,
            })
          }
        : order
    ) as StoreOrder[];
    saveOrders(newOrders);
  };

  const addPaymentProof = (orderId: string, imageUri: string) => {
    const newOrders = orders.map(order =>
      order.id === orderId
        ? {
            ...order,
            paymentProof: {
              id: `proof_${Date.now()}`,
              imageUri,
              uploadedAt: Date.now(),
            },
            status: 'payment_review' as const,
          }
        : order
    ) as StoreOrder[];
    saveOrders(newOrders);
  };

  const getStoreOrders = (storeId: string) => {
    const allOrders = [...MOCK_STORE_ORDERS, ...orders];
    const uniqueOrders = allOrders.filter((order, index, self) => 
      index === self.findIndex((o) => o.id === order.id)
    );
    return uniqueOrders
      .filter(o => o.storeId === storeId)
      .sort((a, b) => b.createdAt - a.createdAt);
  };

  const getCustomerOrders = (customerId: string) => {
    return orders.filter(o => o.customerId === customerId).sort((a, b) => b.createdAt - a.createdAt);
  };

  const getOrderById = (orderId: string) => {
    let found = orders.find(o => o.id === orderId);
    if (!found) {
      found = MOCK_STORE_ORDERS.find(o => o.id === orderId);
    }
    return found;
  };

  // ✅ دالة رفض السائق للطلب
  const rejectOrderByDriver = (orderId: string, driverId: string, reason?: string) => {
    console.log(`السائق ${driverId} يرفض الطلب ${orderId}`);
    
    const newOrders = orders.map(order => {
      if (order.id === orderId && order.driverId === driverId) {
        return {
          ...order,
          status: 'payment_review' as const,
          driverId: undefined,
          driverName: undefined,
          driverPhone: undefined,
          estimatedMinutes: undefined,
          vehicleType: undefined,
          rejectionReason: reason || "السائق رفض الطلب",
        };
      }
      return order;
    });
    
    saveOrders(newOrders);
    console.log(`✅ تم رفض الطلب ${orderId} وعاد للحالة السابقة`);
  };

  // ✅ دالة تحديث حالة الطلب من قبل السائق (قبول أو رفض) - وضعها هنا داخل الـ Provider
  const updateOrderByDriver = (orderId: string, driverId: string, action: 'accept' | 'reject', reason?: string) => {
    console.log(`السائق ${driverId} يقوم بـ ${action} للطلب ${orderId}`);
    
    const newOrders = orders.map(order => {
      if (order.id === orderId && order.driverId === driverId) {
        if (action === 'accept') {
          return {
            ...order,
            status: 'driver_accepted' as const,
          };
        } else {
          return {
            ...order,
            status: 'payment_review' as const,
            driverId: undefined,
            driverName: undefined,
            driverPhone: undefined,
            estimatedMinutes: undefined,
            vehicleType: undefined,
            rejectionReason: reason || "السائق رفض الطلب",
          };
        }
      }
      return order;
    });
    
    saveOrders(newOrders);
    console.log(`✅ تم تحديث الطلب ${orderId} إلى ${action === 'accept' ? 'driver_accepted' : 'payment_review'}`);
  };

  return (
    <StoreOrderContext.Provider value={{
      orders,
      createOrder,
      updateOrderStatus,
      addPaymentProof,
      getStoreOrders,
      getCustomerOrders,
      getOrderById,
      rejectOrderByDriver,
      updateOrderByDriver, // ✅ أضفنا الدالة هنا
    }}>
      {children}
    </StoreOrderContext.Provider>
  );
}

export const useStoreOrder = () => {
  const context = useContext(StoreOrderContext);
  if (!context) throw new Error('useStoreOrder must be used within StoreOrderProvider');
  return context;
};