import React, { useState, useLayoutEffect, useEffect } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import auth from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import ShareInput from "@/component/input/share.input";
import { useCurrentApp } from "@/context/app.context";
import { APP_COLOR } from "@/utils/constant";
import { useUpdateUser } from "@/api/hooks";
import { useToast } from "@/context/toast.context";
import ConfirmModal from "@/component/ConfirmModal";
import Avatar from "@/component/Avatar";
import { AVATAR_PRESETS, PRESET_KEYS } from "@/utils/avatar-presets";

// --- Components Con ---
const SettingItem = ({
  icon,
  label,
  value,
  onPress,
  isDestructive = false,
  rightIcon = true,
  IconComponent = Ionicons,
}: any) => (
  <TouchableOpacity
    style={styles.itemContainer}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.itemLeft}>
      <View style={styles.iconBox}>
        <IconComponent
          name={icon}
          size={22}
          color={isDestructive ? "#FF3B30" : "#666"}
        />
      </View>
      <Text style={[styles.itemLabel, isDestructive && styles.destructiveText]}>
        {label}
      </Text>
    </View>
    <View style={styles.itemRight}>
      {value && <Text style={styles.itemValue}>{value}</Text>}
      {rightIcon && <Ionicons name="chevron-forward" size={20} color="#CCC" />}
    </View>
  </TouchableOpacity>
);

const Section = ({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) => (
  <View style={styles.sectionWrapper}>
    {title && <Text style={styles.sectionTitle}>{title}</Text>}
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const AccountPage = () => {
  const { appState, setAppState } = useCurrentApp();
  const navigation = useNavigation();
  const { showToast } = useToast();

  // 1. State
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState(appState?.userName || "");
  const [email, setEmail] = useState(appState?.email || "");
  const [selectedAvatar, setSelectedAvatar] = useState(appState?.avatar || "");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 2. Hooks
  const { mutate: updateUser, isPending: isUpdatingUser } = useUpdateUser();

  // 3. Header Config
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Sync state khi appState thay đổi
  useEffect(() => {
    if (appState) {
      setUserName(appState.userName || "");
      setEmail(appState.email || "");
      setSelectedAvatar(appState.avatar || "");
    }
  }, [appState]);

  // 4. Handlers
  const handleUpdate = () => {
    if (!appState?.userId) return;
    updateUser(
      {
        id: String(appState.userId),
        name: userName,
        email: email,
        avatar: selectedAvatar,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          showToast("success", "Thành công", "Cập nhật thông tin thành công!");
        },
        onError: () => {
          showToast("error", "Thất bại", "Có lỗi xảy ra khi cập nhật.");
        },
      }
    );
  };

  const performLogout = async () => {
    try {
      const user = auth().currentUser;
      if (user) {
        await auth().signOut();
        const isGoogleUser = user.providerData.some(
          (p) => p.providerId === "google.com"
        );
        if (isGoogleUser) {
          try {
            await GoogleSignin.signOut();
            await GoogleSignin.revokeAccess();
          } catch (e) {
            console.log("Google logout silent error", e);
          }
        }
      }
      await AsyncStorage.removeItem("access_token");
      setAppState(null);
      router.replace("/(auth)/login");
      showToast("success", "Đăng xuất", "Hẹn gặp lại bạn 👋");
    } catch (error) {
      showToast("error", "Lỗi", "Không thể đăng xuất");
    }
  };

  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <View style={styles.editHeader}>
          <TouchableOpacity
            onPress={() => setIsEditing(false)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.editTitle}>Cập nhật thông tin</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.editContent}>
          <View style={styles.center}>
            <Avatar
              name={userName || "User"}
              avatar={selectedAvatar}
              size={120}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.avatarList}
            >
              {PRESET_KEYS.map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setSelectedAvatar(key)}
                  style={[
                    styles.avatarOption,
                    selectedAvatar === key && styles.avatarOptionSelected,
                  ]}
                >
                  <Image
                    source={AVATAR_PRESETS[key]}
                    style={styles.avatarOptionImage}
                  />
                  {selectedAvatar === key && (
                    <View style={styles.checkIcon}>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={APP_COLOR.ORANGE}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={{ gap: 20 }}>
            <ShareInput
              title="Tên người dùng"
              value={userName}
              onChangeText={setUserName}
            />
            <ShareInput
              title="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleUpdate}
              disabled={isUpdatingUser}
            >
              {isUpdatingUser ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Lưu Thay Đổi</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <Avatar
            name={appState?.userName || "User"}
            avatar={appState?.avatar}
            size={60}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {appState?.userName || "Người dùng"}
            </Text>
            <Text style={styles.profileEmail}>{appState?.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.updateButtonText}>Cập nhật</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />

        <Section title="Cài đặt">
          <SettingItem
            icon="language-outline"
            label="Ngôn ngữ"
            value="Tiếng Việt"
            rightIcon={false}
          />
          <SettingItem
            icon="attach-money"
            IconComponent={MaterialIcons}
            label="Đơn vị tiền tệ"
            value="VND"
            rightIcon={false}
          />
        </Section>

        <Section title="Tài khoản">
          <SettingItem
            icon="log-out-outline"
            label="Đăng xuất"
            onPress={() => setShowLogoutConfirm(true)}
            isDestructive
          />
        </Section>

        <ConfirmModal
          visible={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={performLogout}
          title="Đăng xuất"
          message="Bạn có chắc chắn muốn đăng xuất?"
          confirmText="Đăng xuất"
          type="danger"
          icon="log-out-outline"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
  },
  profileInfo: { flex: 1, marginLeft: 15 },
  profileName: { fontSize: 18, fontWeight: "bold", color: "#333" },
  profileEmail: { fontSize: 13, color: "#888" },
  updateButton: {
    backgroundColor: APP_COLOR.ORANGE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  updateButtonText: { color: "white", fontWeight: "600", fontSize: 13 },
  sectionWrapper: { marginBottom: 20, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  itemLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 32, alignItems: "center", marginRight: 12 },
  itemLabel: { fontSize: 15, color: "#333" },
  itemRight: { flexDirection: "row", alignItems: "center" },
  itemValue: { fontSize: 14, color: "#999", marginRight: 8 },
  destructiveText: { color: "#FF3B30" },
  editContainer: { flex: 1, backgroundColor: "white" },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  backButton: { padding: 5 },
  editTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  editContent: { padding: 20 },
  center: { alignItems: "center", marginBottom: 20 },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveButton: { backgroundColor: APP_COLOR.ORANGE },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  avatarList: { flexDirection: "row", marginTop: 20 },
  avatarOption: {
    marginRight: 15,
    padding: 2,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  avatarOptionSelected: { borderColor: APP_COLOR.ORANGE },
  avatarOptionImage: { width: 50, height: 50, borderRadius: 25 },
  checkIcon: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "white",
    borderRadius: 12,
  },
});

export default AccountPage;
