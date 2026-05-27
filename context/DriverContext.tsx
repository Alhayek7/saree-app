import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useState } from "react";

const DRIVER_API_ID_KEY = "@saree_driver_api_id";

interface DriverContextValue {
  driverApiId: number | null;
  setDriverApiId: (id: number) => Promise<void>;
  loadDriverApiId: () => Promise<void>;
}

const DriverContext = createContext<DriverContextValue | undefined>(undefined);

export function DriverProvider({ children }: { children: React.ReactNode }) {
  const [driverApiId, setIdState] = useState<number | null>(null);

  const loadDriverApiId = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(DRIVER_API_ID_KEY);
      if (stored) setIdState(Number(stored));
    } catch {}
  }, []);

  const setDriverApiId = useCallback(async (id: number) => {
    setIdState(id);
    await AsyncStorage.setItem(DRIVER_API_ID_KEY, String(id));
  }, []);

  return (
    <DriverContext.Provider value={{ driverApiId, setDriverApiId, loadDriverApiId }}>
      {children}
    </DriverContext.Provider>
  );
}

export function useDriver() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error("useDriver must be used within DriverProvider");
  return ctx;
}
