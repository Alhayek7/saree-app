import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";


// أضف هذا مع باقي الواجهات
interface CustomOfferResult {
  success: boolean;
  driverBusy?: boolean;
  message?: string;
}

export type OrderStatus =
  | "searching"
  | "bidding"
  | "accepted"
  | "picked"
  | "delivered"
  | "completed"
  | "cancelled";

export type VehicleType = "car" | "bike" | "truck";
export type PackageType = "normal" | "fragile" | "document";

export interface DriverOffer {
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  totalDeliveries: number;
  vehicleType: VehicleType;
  price: number;
  estimatedMinutes: number;
}

export type PaymentMethod = "cash" | "electronic" | "wallet";

export type DriverProgress = "going" | "picked_up" | "delivering" | "done";

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: "customer" | "driver";
  text: string;
  timestamp: string;
  isRead: boolean;
}


export interface Order {
  id: string;
  customerId: string;
  pickupAddress: string;
  deliveryAddress: string;
  packageDescription: string;
  vehicleType: VehicleType;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  offers?: DriverOffer[];
  selectedOffer?: DriverOffer;
  driverProgress?: DriverProgress;
  commissionDeducted?: boolean;
  messages?: ChatMessage[];
  createdAt: string;
  acceptedAt?: string;
  pickedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  finalPrice?: number;
  rating?: number;
  ratingComment?: string;
  
}

export interface CreateOrderData {
  customerId: string;
  pickupAddress: string;
  deliveryAddress: string;
  packageDescription: string;
  vehicleType: VehicleType;
  paymentMethod: PaymentMethod;
}

interface OrdersContextValue {
  orders: Order[];
  createOrder: (data: CreateOrderData) => Order;
  selectOffer: (orderId: string, offer: DriverOffer) => void;
  submitDriverBid: (orderId: string, bid: DriverOffer) => void;
  updateDriverStatus: (orderId: string, status: "going" | "picked" | "driver_delivered") => void;
  confirmDelivery: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  rateOrder: (orderId: string, rating: number, comment: string) => void;
  sendMessage: (orderId: string, senderId: string, senderRole: "customer" | "driver", text: string) => void;
  markMessagesRead: (orderId: string, readerId: string) => void;
  getUnreadCount: (orderId: string, readerId: string) => number;
  getMyOrders: (customerId: string) => Order[];
  getDriverActiveOrder: (driverId: string) => Order | undefined;
  getSearchingOrders: () => Order[];
  getOrderById: (id: string) => Order | undefined;
  sendCustomOfferToDriver: (orderId: string, driverId: string, price: number) => Promise<CustomOfferResult>;
switchToCheapestOffers: (orderId: string) => void;
rejectOffer: (orderId: string, driverId: string) => void;

}

const ORDERS_KEY = "@saree_orders_v2";

const MOCK_DRIVERS_CAR: DriverOffer[] = [
  { driverId: "d1", driverName: "محمد سعيد", driverPhone: "0597654321", driverRating: 4.9, totalDeliveries: 312, vehicleType: "car", price: 20, estimatedMinutes: 12 },
  { driverId: "d2", driverName: "عمر سامي", driverPhone: "0592000000", driverRating: 4.7, totalDeliveries: 145, vehicleType: "car", price: 25, estimatedMinutes: 8 },
  { driverId: "d3", driverName: "خالد أحمد", driverPhone: "0593112233", driverRating: 4.6, totalDeliveries: 89, vehicleType: "car", price: 18, estimatedMinutes: 18 },
  { driverId: "d4", driverName: "يوسف إبراهيم", driverPhone: "0594223344", driverRating: 4.8, totalDeliveries: 201, vehicleType: "car", price: 22, estimatedMinutes: 14 },
];

const MOCK_DRIVERS_BIKE: DriverOffer[] = [
  { driverId: "b1", driverName: "سامي نصر", driverPhone: "0595334455", driverRating: 4.8, totalDeliveries: 256, vehicleType: "bike", price: 10, estimatedMinutes: 10 },
  { driverId: "b2", driverName: "رامي حسن", driverPhone: "0596445566", driverRating: 4.5, totalDeliveries: 98, vehicleType: "bike", price: 12, estimatedMinutes: 7 },
  { driverId: "b3", driverName: "أنس جابر", driverPhone: "0597556677", driverRating: 4.9, totalDeliveries: 187, vehicleType: "bike", price: 9, estimatedMinutes: 15 },
];

const MOCK_DRIVERS_TRUCK: DriverOffer[] = [
  { driverId: "t1", driverName: "أبو العبد", driverPhone: "0598667788", driverRating: 4.7, totalDeliveries: 75, vehicleType: "truck", price: 60, estimatedMinutes: 20 },
  { driverId: "t2", driverName: "حسام الدين", driverPhone: "0591778899", driverRating: 4.6, totalDeliveries: 52, vehicleType: "truck", price: 75, estimatedMinutes: 15 },
  { driverId: "t3", driverName: "وسيم صالح", driverPhone: "0592889900", driverRating: 4.8, totalDeliveries: 110, vehicleType: "truck", price: 55, estimatedMinutes: 25 },
];

function getMockDrivers(vehicleType: VehicleType): DriverOffer[] {
  const pool = vehicleType === "car" ? MOCK_DRIVERS_CAR : vehicleType === "bike" ? MOCK_DRIVERS_BIKE : MOCK_DRIVERS_TRUCK;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).sort((a, b) => a.price - b.price);
}

const SAMPLE_ORDERS: Order[] = [
  {
    id: "ORD-001",
    customerId: "customer_001",
    pickupAddress: "الرمال - شارع الوحدة",
    deliveryAddress: "الزيتون - دوار أبو حصيرة",
    packageDescription: "كرتون ملابس",
    vehicleType: "car",
    paymentMethod: "cash",
    status: "completed",
    selectedOffer: MOCK_DRIVERS_CAR[0],
    finalPrice: 20,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    rating: 5,
    ratingComment: "سائق ممتاز وسريع",
  },
  {
    id: "ORD-002",
    customerId: "customer_001",
    pickupAddress: "الشجاعية - شارع الثلاثيني",
    deliveryAddress: "الرمال - برج الأمل",
    packageDescription: "جهاز لابتوب قابل للكسر",
    vehicleType: "car",
    paymentMethod: "wallet",
    status: "completed",
    selectedOffer: MOCK_DRIVERS_CAR[1],
    finalPrice: 25,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
    rating: 4,
  },
];

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const stored = await AsyncStorage.getItem(ORDERS_KEY);
      if (stored) {
        const parsed: Order[] = JSON.parse(stored);
        setOrders(() => {
          const ids = new Set(parsed.map((o) => o.id));
          return [...SAMPLE_ORDERS.filter((o) => !ids.has(o.id)), ...parsed];
        });
      }
    } catch {}
  };

  const persist = (updated: Order[]) => {
    const toSave = updated.filter((o) => !SAMPLE_ORDERS.some((s) => s.id === o.id));
    AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(toSave)).catch(() => {});
    setOrders(updated);
  };

  const createOrder = useCallback(
    (data: CreateOrderData): Order => {
      const newOrder: Order = {
        id: `ORD-${Date.now().toString().slice(-7)}`,
        ...data,
        status: "searching",
        createdAt: new Date().toISOString(),
      };
      const updated = [newOrder, ...orders];
      persist(updated);

      // Simulate: after 5s drivers send offers
      setTimeout(() => {
        const offers = getMockDrivers(data.vehicleType);
        setOrders((prev) => {
          const next = prev.map((o) =>
            o.id === newOrder.id ? { ...o, status: "bidding" as OrderStatus, offers } : o
          );
          const toSave = next.filter((o) => !SAMPLE_ORDERS.some((s) => s.id === o.id));
          AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(toSave)).catch(() => {});
          return next;
        });
      }, 5000);

      return newOrder;
    },
    [orders]
  );

  const selectOffer = useCallback((orderId: string, offer: DriverOffer) => {
    setOrders((prev) => {
      const next = prev.map((o) =>
        o.id === orderId
          ? { ...o, status: "accepted" as OrderStatus, selectedOffer: offer, finalPrice: offer.price, acceptedAt: new Date().toISOString() }
          : o
      );
      const toSave = next.filter((o) => !SAMPLE_ORDERS.some((s) => s.id === o.id));
      AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(toSave)).catch(() => {});

      // Simulate: picked after 15s
      setTimeout(() => {
        setOrders((p2) => {
          const n2 = p2.map((o) =>
            o.id === orderId && o.status === "accepted"
              ? { ...o, status: "picked" as OrderStatus, pickedAt: new Date().toISOString() }
              : o
          );
          const s2 = n2.filter((o) => !SAMPLE_ORDERS.some((s) => s.id === o.id));
          AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(s2)).catch(() => {});
          return n2;
        });
      }, 15000);

      // Simulate: delivered after 50s
      setTimeout(() => {
        setOrders((p3) => {
          const n3 = p3.map((o) =>
            o.id === orderId && o.status === "picked"
              ? { ...o, status: "delivered" as OrderStatus, deliveredAt: new Date().toISOString() }
              : o
          );
          const s3 = n3.filter((o) => !SAMPLE_ORDERS.some((s) => s.id === o.id));
          AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(s3)).catch(() => {});
          return n3;
        });
      }, 50000);

      return next;
    });
  }, []);

  const rejectOffer = useCallback((orderId: string, driverId: string) => {
  setOrders((prev) => {
    const order = prev.find(o => o.id === orderId);
    if (!order || !order.offers) return prev;
    
    // إزالة هذا السائق من قائمة العروض
    const remainingOffers = order.offers.filter(o => o.driverId !== driverId);
    
    const next = prev.map((o) =>
      o.id === orderId
        ? { ...o, offers: remainingOffers }
        : o
    );
    
    const toSave = next.filter((o) => !SAMPLE_ORDERS.some((s) => s.id === o.id));
    AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(toSave)).catch(() => {});
    return next;
  });
}, 

  
  []);

  const confirmDelivery = useCallback((orderId: string) => {
    setOrders((prev) => {
      const next = prev.map((o) =>
        o.id === orderId && o.status === "delivered"
          ? { ...o, status: "completed" as OrderStatus, completedAt: new Date().toISOString() }
          : o
      );
      const toSave = next.filter((o) => !SAMPLE_ORDERS.some((s) => s.id === o.id));
      AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(toSave)).catch(() => {});
      return next;
    });
  }, []);

  const cancelOrder = useCallback((orderId: string) => {
    setOrders((prev) => {
      const next = prev.map((o) =>
        o.id === orderId && (o.status === "searching" || o.status === "bidding")
          ? { ...o, status: "cancelled" as OrderStatus }
          : o
      );
      const toSave = next.filter((o) => !SAMPLE_ORDERS.some((s) => s.id === o.id));
      AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(toSave)).catch(() => {});
      return next;
    });
  }, []);

  const rateOrder = useCallback((orderId: string, rating: number, comment: string) => {
    setOrders((prev) => {
      const next = prev.map((o) =>
        o.id === orderId ? { ...o, rating, ratingComment: comment } : o
      );
      const toSave = next.filter((o) => !SAMPLE_ORDERS.some((s) => s.id === o.id));
      AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(toSave)).catch(() => {});
      return next;
    });
  }, []);

  const submitDriverBid = useCallback((orderId: string, bid: DriverOffer) => {
    setOrders((prev) => {
      const next = prev.map((o) => {
        if (o.id !== orderId) return o;
        const existing = o.offers ?? [];
        const already = existing.some((b) => b.driverId === bid.driverId);
        if (already) return o;
        const newOffers = [...existing, bid].sort((a, b) => a.price - b.price).slice(0, 3);
        return { ...o, offers: newOffers, status: "bidding" as OrderStatus };
      });
      const toSave = next.filter((o) => !SAMPLE_ORDERS.some((s) => s.id === o.id));
      AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(toSave)).catch(() => {});
      return next;
    });
  }, []);

  const updateDriverStatus = useCallback((orderId: string, status: "going" | "picked" | "driver_delivered") => {
    setOrders((prev) => {
      const next = prev.map((o) => {
        if (o.id !== orderId) return o;
        if (status === "going") return { ...o, driverProgress: "going" as DriverProgress, commissionDeducted: true };
        if (status === "picked") return { ...o, driverProgress: "picked_up" as DriverProgress, status: "picked" as OrderStatus, pickedAt: new Date().toISOString() };
        if (status === "driver_delivered") return { ...o, driverProgress: "done" as DriverProgress, status: "delivered" as OrderStatus, deliveredAt: new Date().toISOString() };
        return o;
      });
      const toSave = next.filter((o) => !SAMPLE_ORDERS.some((s) => s.id === o.id));
      AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(toSave)).catch(() => {});
      return next;
    });
  }, []);

  const DRIVER_AUTO_REPLIES = [
    "في الطريق إليك الآن 🚗",
    "وصلت قريباً، انتظرني",
    "تم استلام الطرد ✅",
    "سأكون عندك خلال دقائق",
    "الطريق واضح والحمد لله",
    "موقعك وصلني، في الطريق",
    "تمام، راح أنتبه على الطرد",
    "دقيقتين وأكون عندك 👍",
  ];

  const sendMessage = useCallback((orderId: string, senderId: string, senderRole: "customer" | "driver", text: string) => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      orderId,
      senderId,
      senderRole,
      text,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setOrders((prev) => {
      const next = prev.map((o) => {
        if (o.id !== orderId) return o;
        return { ...o, messages: [...(o.messages ?? []), newMsg] };
      });
      const toSave = next.filter((o) => !SAMPLE_ORDERS.some((s) => s.id === o.id));
      AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(toSave)).catch(() => {});
      return next;
    });

    // Auto-reply from driver when customer sends a message
    if (senderRole === "customer") {
      const delay = 3000 + Math.random() * 5000;
      setTimeout(() => {
        const replyText = DRIVER_AUTO_REPLIES[Math.floor(Math.random() * DRIVER_AUTO_REPLIES.length)];
        const replyMsg: ChatMessage = {
          id: `msg_${Date.now()}_reply`,
          orderId,
          senderId: "driver_auto",
          senderRole: "driver",
          text: replyText,
          timestamp: new Date().toISOString(),
          isRead: false,
        };
        setOrders((prev) => {
          const next = prev.map((o) => {
            if (o.id !== orderId) return o;
            return { ...o, messages: [...(o.messages ?? []), replyMsg] };
          });
          const toSave = next.filter((o) => !SAMPLE_ORDERS.some((s) => s.id === o.id));
          AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(toSave)).catch(() => {});
          return next;
        });
      }, delay);
    }
  }, []);

  const markMessagesRead = useCallback((orderId: string, readerId: string) => {
    setOrders((prev) => {
      const next = prev.map((o) => {
        if (o.id !== orderId) return o;
        const msgs = (o.messages ?? []).map((m) =>
          m.senderId !== readerId ? { ...m, isRead: true } : m
        );
        return { ...o, messages: msgs };
      });
      const toSave = next.filter((o) => !SAMPLE_ORDERS.some((s) => s.id === o.id));
      AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(toSave)).catch(() => {});
      return next;
    });
  }, []);

  const getUnreadCount = useCallback((orderId: string, readerId: string): number => {
    const order = orders.find((o) => o.id === orderId);
    if (!order?.messages) return 0;
    return order.messages.filter((m) => !m.isRead && m.senderId !== readerId).length;
  }, [orders]);

  const getMyOrders = useCallback(
    (customerId: string) => orders.filter((o) => o.customerId === customerId),
    [orders]
  );

  const getDriverActiveOrder = useCallback(
    (driverId: string) => orders.find((o) =>
      o.selectedOffer?.driverId === driverId &&
      ["accepted", "picked", "delivered"].includes(o.status)
    ),
    [orders]
  );

  const getSearchingOrders = useCallback(
    () => orders.filter((o) => o.status === "searching" || o.status === "bidding"),
    [orders]
  );

  const getOrderById = useCallback(
    (id: string) => orders.find((o) => o.id === id),
    [orders]
  );
  const sendCustomOfferToDriver = async (
  orderId: string,
  driverId: string,
  price: number
): Promise<CustomOfferResult> => {
  console.log(`Sending custom offer: Order ${orderId}, Driver ${driverId}, Price ${price}`);
  return { success: true };
};

const switchToCheapestOffers = (orderId: string) => {
  console.log(`Switching to cheapest offers for order ${orderId}`);
};


return (
  <OrdersContext.Provider value={{
    orders, createOrder, selectOffer, submitDriverBid, updateDriverStatus,
    confirmDelivery, cancelOrder, rateOrder,
    sendMessage, markMessagesRead, getUnreadCount,
    getMyOrders, getDriverActiveOrder, getSearchingOrders, getOrderById,
    sendCustomOfferToDriver,
    switchToCheapestOffers,
    rejectOffer,
    
  }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}

