import React, { useEffect } from "react";
import { Platform } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter, setBaseUrl } from "@/api-client";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { getToken } from "@/services/storage";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? null;
setBaseUrl(apiUrl);
setAuthTokenGetter(getToken);
const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(Platform.OS === "web" ? {} : { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  useEffect(() => { if (fontsLoaded || fontError) void SplashScreen.hideAsync(); }, [fontsLoaded, fontError]);
  if (!fontsLoaded && !fontError) return null;
  return <SafeAreaProvider><ErrorBoundary><QueryClientProvider client={queryClient}><GestureHandlerRootView style={{ flex: 1 }}><KeyboardProvider><AuthProvider><Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}><Stack.Screen name="index" /><Stack.Screen name="home" /><Stack.Screen name="company/[id]" /><Stack.Screen name="employee/[id]" /></Stack></AuthProvider></KeyboardProvider></GestureHandlerRootView></QueryClientProvider></ErrorBoundary></SafeAreaProvider>;
}
