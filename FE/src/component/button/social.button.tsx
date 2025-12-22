import { Image, StyleSheet, View } from "react-native";
import ShareButton from "./share.button";
import TextBetweenLine from "./text.between.line";
import ggLogo from "@/assets/auth/google.png";
import { loginWithGoogle } from "@/utils/googleAuth";
import { useToast } from "@/context/toast.context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCurrentApp } from "@/context/app.context";

const styles = StyleSheet.create({
  container: {
    gap: 25,
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
  },
});

interface IProps {
  title: string;
}

const SocialButton = ({ title }: IProps) => {
  const { showToast } = useToast();
  const { setAppState } = useCurrentApp();

  // @/component/button/social.button.tsx
  const handleGoogleLogin = async () => {
    try {
      const res = await loginWithGoogle(); // Dữ liệu trả về là AuthResponse

      if (res && res.token) {
        // 1. Lưu JWT của hệ thống vào máy
        await AsyncStorage.setItem("token", res.token);

        // 2. Cập nhật trạng thái App (Khớp với AuthResponse của BE)
        setAppState({
          token: res.token,
          userId: res.userId,
          userName: res.userName,
          email: res.email,
          avatar: res.avatar,
          role: res.role,
        });

        showToast("success", "Thành công", `Chào mừng ${res.userName}!`);

        // 3. Điều hướng thẳng vào Tabs
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error("Google Login Error:", error);
      showToast("error", "Lỗi", "Đăng nhập thất bại, vui lòng thử lại");
    }
  };

  return (
    <View style={styles.container}>
      <TextBetweenLine textColor="black" title={title} />

      <View style={styles.buttonRow}>
        <ShareButton
          title="Google"
          onPress={handleGoogleLogin}
          textStyle={{ textTransform: "uppercase" }}
          buttonStyle={{
            backgroundColor: "#fff",
            paddingHorizontal: 20,
            justifyContent: "center",
            borderRadius: 30,
          }}
          icon={<Image source={ggLogo} />}
        />
      </View>
    </View>
  );
};

export default SocialButton;
