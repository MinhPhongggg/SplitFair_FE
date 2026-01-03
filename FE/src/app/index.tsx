import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import { configureGoogleSignIn } from "@/utils/google.config";
import { useCurrentApp } from "@/context/app.context";
import { getAccountAPI } from "@/utils/api";
import { APP_COLOR } from "@/utils/constant";

// Giữ splash screen cho tới khi check auth xong
SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get("window");

const RootPage = () => {
  const { setAppState } = useCurrentApp();
  const progress = useRef(new Animated.Value(0)).current;
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    configureGoogleSignIn();

    const listenerId = progress.addListener(({ value }) => {
      setProgressPercent(Math.floor(value));
    });

    return () => {
      progress.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    const bootstrapAsync = async () => {
      // Start initial animation
      Animated.timing(progress, {
        toValue: 70,
        duration: 1500,
        useNativeDriver: false,
      }).start();

      let nextRoute = "/(auth)/welcome";

      try {
        const token = await AsyncStorage.getItem("token");

        if (token) {
          const res = await getAccountAPI();

          if (res?.email || res?.userName) {
            setAppState({
              ...res,
              token: res.token || token,
            });
            nextRoute = "/(tabs)";
          }
        }
      } catch (error) {
        console.warn("Auth bootstrap error:", error);
      } finally {
        // Complete animation
        Animated.timing(progress, {
          toValue: 100,
          duration: 500,
          useNativeDriver: false,
        }).start(async () => {
          await SplashScreen.hideAsync();
          router.replace(nextRoute as any);
        });
      }
    };

    bootstrapAsync();
  }, []);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  // return (
  //   <View style={styles.container}>
  //     <View style={styles.contentContainer}>
  //       {/* Logo Section */}
  //       <View style={styles.logoContainer}>
  //         <View style={styles.logoCircle}>
  //           <Image
  //             source={require("@/assets/logo-loading.png")}
  //             style={styles.logoImage}
  //             resizeMode="contain"
  //           />
  //         </View>
  //       </View>

  //       {/* App Name */}
  //       <Text style={styles.appName}>SplitFair</Text>
  //       <Text style={styles.tagline}>Bill splitting made simple</Text>

  //       {/* Progress Section */}
  //       <View style={styles.progressContainer}>
  //         <View style={styles.progressBarBg}>
  //           <Animated.View
  //             style={[styles.progressBarFill, { width: widthInterpolated }]}
  //           />
  //         </View>
  //         <View style={styles.progressTextRow}>
  //           <Text style={styles.progressLabel}>LOADING...</Text>
  //           <Text style={styles.progressPercent}>{progressPercent}%</Text>
  //         </View>
  //       </View>
  //     </View>

  //     {/* Footer */}
  //     <View style={styles.footer}>
  //       <Text style={styles.footerText}>SECURE CONNECTION</Text>
  //     </View>
  //   </View>
  // );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLOR.ORANGE,
    justifyContent: "space-between",
    paddingVertical: 60,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  logoContainer: {
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 130,
    height: 130,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 60,
  },
  progressContainer: {
    width: width * 0.8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 3,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.9,
  },
  progressPercent: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
});

export default RootPage;
