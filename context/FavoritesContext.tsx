// context/FavoritesContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FavoriteDriver {
  id: string;
  name: string;
  rating: number;
  completedOrdersWithMe: number;
  phone: string;
  avatar?: string;
  vehicleType?: string;
  approved: boolean;
  addedAt: number;
}

interface FavoritesContextType {
  favorites: FavoriteDriver[];
  pendingFavorites: FavoriteDriver[];
  addFavorite: (driver: Omit<FavoriteDriver, 'approved' | 'addedAt'>) => Promise<{ success: boolean; message?: string }>;
  removeFavorite: (driverId: string) => Promise<void>;
  isFavorite: (driverId: string) => boolean;
  isPending: (driverId: string) => boolean;
  updateApproval: (driverId: string, approved: boolean) => Promise<void>;
  canAddMore: boolean;
  getFavoriteById: (driverId: string) => FavoriteDriver | undefined;
  refreshFavorites: () => Promise<void>;
  getFavoriteCount: () => number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const MAX_FAVORITES = 5;
const STORAGE_KEY = 'favorite_drivers';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteDriver[]>([]);
  const [pendingFavorites, setPendingFavorites] = useState<FavoriteDriver[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const all = JSON.parse(stored);
        setFavorites(all.filter((f: FavoriteDriver) => f.approved));
        setPendingFavorites(all.filter((f: FavoriteDriver) => !f.approved));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  const saveFavorites = async (allFavorites: FavoriteDriver[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allFavorites));
      setFavorites(allFavorites.filter(f => f.approved));
      setPendingFavorites(allFavorites.filter(f => !f.approved));
    } catch (error) {
      console.error('Error saving favorites:', error);
      throw error;
    }
  };

  const addFavorite = async (driver: Omit<FavoriteDriver, 'approved' | 'addedAt'>): Promise<{ success: boolean; message?: string }> => {
    try {
      const existingAll = [...favorites, ...pendingFavorites];
      
      if (existingAll.some(f => f.id === driver.id)) {
        return { success: false, message: '⚠️ هذا السائق موجود بالفعل في قائمتك' };
      }

      if (favorites.length >= MAX_FAVORITES) {
        return { success: false, message: `⚠️ لا يمكنك إضافة أكثر من ${MAX_FAVORITES} سائقين مفضلين` };
      }

      const newFavorite: FavoriteDriver = {
        ...driver,
        approved: true, // Auto-approve for demo
        addedAt: Date.now(),
      };

      const allFavorites = [...existingAll, newFavorite];
      await saveFavorites(allFavorites);
      
      return { success: true, message: '✅ تم إضافة السائق إلى مفضلاتك بنجاح' };
    } catch (error) {
      console.error('Error adding favorite:', error);
      return { success: false, message: '❌ حدث خطأ أثناء إضافة السائق' };
    }
  };

  const removeFavorite = async (driverId: string) => {
    try {
      const allFavorites = [...favorites, ...pendingFavorites];
      const newFavorites = allFavorites.filter(f => f.id !== driverId);
      await saveFavorites(newFavorites);
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  };

  const updateApproval = async (driverId: string, approved: boolean) => {
    try {
      const allFavorites = [...favorites, ...pendingFavorites];
      const newFavorites = allFavorites.map(f =>
        f.id === driverId ? { ...f, approved } : f
      );
      await saveFavorites(newFavorites);
    } catch (error) {
      console.error('Error updating approval:', error);
      throw error;
    }
  };

  const isFavorite = (driverId: string): boolean => {
    return favorites.some(f => f.id === driverId);
  };

  const isPending = (driverId: string): boolean => {
    return pendingFavorites.some(f => f.id === driverId);
  };

  const canAddMore = favorites.length < MAX_FAVORITES;

  const getFavoriteById = (driverId: string): FavoriteDriver | undefined => {
    return [...favorites, ...pendingFavorites].find(f => f.id === driverId);
  };

  const refreshFavorites = async (): Promise<void> => {
    await loadFavorites();
  };

  const getFavoriteCount = (): number => {
    return favorites.length;
  };

  // تحذير إذا لم يتم التحميل بعد
  if (!isInitialized) {
    // يمكنك إضافة شاشة تحميل هنا إذا أردت
    return <>{children}</>;
  }

  return (
    <FavoritesContext.Provider value={{
      favorites,
      pendingFavorites,
      addFavorite,
      removeFavorite,
      isFavorite,
      isPending,
      updateApproval,
      canAddMore,
      getFavoriteById,
      refreshFavorites,
      getFavoriteCount,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('❌ useFavorites must be used within FavoritesProvider');
  }
  return context;
};