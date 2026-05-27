// context/CartContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  storeId: string;
  storeName: string;
  stock?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemsByStore: () => Record<string, CartItem[]>;
  getTotalItems: number;
  getTotalPrice: number;
  getStoreCount: number;
  isInCart: (productId: string, storeId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_KEY = '@saree_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    AsyncStorage.setItem(CART_KEY, JSON.stringify(newItems)).catch((error) => {
      console.error('Error saving cart:', error);
    });
  };

  const addToCart = (item: Omit<CartItem, 'id' | 'quantity'>) => {
    const existingItem = items.find(
      i => i.productId === item.productId && i.storeId === item.storeId
    );

    let newItems: CartItem[];
    if (existingItem) {
      newItems = items.map(i =>
        i.productId === item.productId && i.storeId === item.storeId
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
    } else {
      const newItem: CartItem = {
        ...item,
        id: `${item.storeId}_${item.productId}_${Date.now()}`,
        quantity: 1,
      };
      newItems = [...items, newItem];
    }
    saveCart(newItems);
  };

  const removeFromCart = (itemId: string) => {
    saveCart(items.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    saveCart(items.map(i => (i.id === itemId ? { ...i, quantity } : i)));
  };

  const clearCart = () => {
    saveCart([]);
  };

  const getItemsByStore = () => {
    const grouped: Record<string, CartItem[]> = {};
    items.forEach(item => {
      if (!grouped[item.storeId]) {
        grouped[item.storeId] = [];
      }
      grouped[item.storeId].push(item);
    });
    return grouped;
  };

  const getTotalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const getTotalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const getStoreCount = Object.keys(getItemsByStore()).length;

  const isInCart = (productId: string, storeId: string) => {
    return items.some(i => i.productId === productId && i.storeId === storeId);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getItemsByStore,
      getTotalItems,
      getTotalPrice,
      getStoreCount,
      isInCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};