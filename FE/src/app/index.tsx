import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import { configureGoogleSignIn } from "@/utils/google.config";
import { useCurrentApp } from "@/context/app.context";
import { getAccountAPI } from "@/utils/api";
import { APP_COLOR } from "@/utils/constant";

// Giữ splash screen cho tới khi check auth xong
SplashScreen.preventAutoHideAsync();

const RootPage = () => {
  const { setAppState } = useCurrentApp();
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          router.replace("/(auth)/welcome");
          return;
        }

        // Gọi API lấy thông tin cá nhân dựa trên token đã lưu
        const res = await getAccountAPI();

        if (res) {
          setAppState({ ...res, token });
          router.replace("/(tabs)");
        } else {
          router.replace("/(auth)/welcome");
        }
      } catch (error) {
        await AsyncStorage.removeItem("token");
        router.replace("/(auth)/welcome");
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    bootstrapAsync();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <ActivityIndicator size="large" color={APP_COLOR.ORANGE} />
    </View>
  );
};

export default RootPage;
