import React, { createContext, useContext, useState } from "react";
import { View, ActivityIndicator } from "react-native";
type Ctx = { setLoading: (v: boolean)=>void };
const LoadingCtx = createContext<Ctx>({ setLoading: ()=>{} });
export function LoadingOverlayProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <LoadingCtx.Provider value={{ setLoading: setVisible }}>
      {children}
      {visible && <View className="absolute inset-0 bg-black/50 items-center justify-center"><ActivityIndicator size="large" /></View>}
    </LoadingCtx.Provider>
  );
}
export function useLoading() { return useContext(LoadingCtx); }
export function LoadingOverlay() { return null; }
