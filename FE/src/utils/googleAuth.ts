import { GoogleSignin } from "@react-native-google-signin/google-signin";
import auth from "@react-native-firebase/auth";
import axios from "@/utils/axios.customize";

export const loginWithGoogle = async () => {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  // 1. Lấy credential từ Google
  const { data } = await GoogleSignin.signIn();
  const idToken = data?.idToken;

  if (!idToken) throw new Error("Không lấy được Google idToken");

  // 2. Dùng Google Credential để đăng nhập vào Firebase (Mobile)
  const googleCredential = auth.GoogleAuthProvider.credential(idToken);
  const userCredential = await auth().signInWithCredential(googleCredential);

  // 3. LẤY FIREBASE ID TOKEN (Cực kỳ quan trọng)
  // Đây mới là token mà Backend Firebase Admin SDK của bạn mong đợi
  const firebaseIdToken = await userCredential.user.getIdToken();

  // 4. Gửi token này lên Spring Boot
  const res = await axios.post("/api/auth/google", {
    token: firebaseIdToken,
  });

  return res;
};
