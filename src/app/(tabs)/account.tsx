import React, { useState, useLayoutEffect } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import ShareInput from '@/component/input/share.input';
import { useCurrentApp } from '@/context/app.context';
import { APP_COLOR } from '@/utils/constant';
import { useUpdateUser, useChangePassword } from '@/api/hooks';
import { getURLBaseBackend } from '@/utils/api';
import { useToast } from '@/context/toast.context';
import ConfirmModal from '@/component/ConfirmModal';
import Avatar from '@/component/Avatar';

// --- Components ---

const SettingItem = ({ 
  icon, 
  iconColor = APP_COLOR.ORANGE, 
  label, 
  value, 
  onPress, 
  isDestructive = false,
  rightIcon = true,
  IconComponent = Ionicons
}: any) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.itemLeft}>
      <View style={styles.iconBox}>
        <IconComponent name={icon} size={22} color={isDestructive ? '#FF3B30' : '#666'} />
      </View>
      <Text style={[styles.itemLabel, isDestructive && styles.destructiveText]}>{label}</Text>
    </View>
    <View style={styles.itemRight}>
      {value && <Text style={styles.itemValue}>{value}</Text>}
      {rightIcon && (
        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      )}
    </View>
  </TouchableOpacity>
);

const Section = ({ title, children }: { title?: string, children: React.ReactNode }) => (
  <View style={styles.sectionWrapper}>
    {title && <Text style={styles.sectionTitle}>{title}</Text>}
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

const AccountPage = () => {
  const { appState, setAppState } = useCurrentApp();
  const navigation = useNavigation();
  const backendUrl = getURLBaseBackend();
  const { showToast } = useToast();

  // 1. State
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState(appState?.userName || '');
  const [email, setEmail] = useState(appState?.email || '');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Change Password State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // 2. Hooks
  const { mutate: updateUser, isPending: isUpdatingUser } = useUpdateUser();
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword();

  // 3. Header Config (Ẩn nút mặc định)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // Ẩn header mặc định để dùng custom UI
    });
  }, [navigation]);

  // 4. Handlers
  const handleUpdate = () => {
    if (!appState?.userId) return;
    updateUser(
      { id: String(appState.userId), name: userName, email: email },
      { 
        onSuccess: () => {
            setIsEditing(false);
            showToast('success', 'Thành công', 'Cập nhật thông tin thành công!');
        },
        onError: (error) => {
            showToast('error', 'Thất bại', 'Có lỗi xảy ra khi cập nhật.');
            console.log(error);
        }
      }
    );
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showToast('error', 'Lỗi', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (currentPassword === newPassword) {
      showToast('error', 'Lỗi', 'Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('error', 'Lỗi', 'Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }
    if (newPassword.length < 6) {
        showToast('error', 'Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
        return;
    }

    changePassword(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          showToast('success', 'Thành công', 'Đổi mật khẩu thành công.');
          setShowChangePassword(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmNewPassword('');
        },
        onError: (err: any) => {
          showToast('error', 'Lỗi', err.response?.data?.message || 'Đổi mật khẩu thất bại.');
        },
      }
    );
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const performLogout = async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      setAppState(null);
      showToast('success', 'Đăng xuất', 'Hẹn gặp lại bạn sớm!');
      router.replace('/(auth)/login'); 
    } catch (error) {
      console.log("Logout error: ", error);
      showToast('error', 'Lỗi', 'Không thể đăng xuất lúc này.');
    }
  };

  const renderAvatar = (size: number) => {
    if (appState?.avatar) {
      return <Image source={{ uri: `${backendUrl}${appState.avatar}` }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
    }
    return <Avatar name={appState?.userName || 'User'} size={size} />;
  };

  // --- Render Edit Mode ---
  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <View style={styles.editHeader}>
          <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.editTitle}>Cập nhật thông tin</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.editContent}>
          <View style={styles.center}>
            <View style={styles.avatarContainerLarge}>
                {renderAvatar(120)}
                <TouchableOpacity style={styles.cameraButton}>
                  <Ionicons name="camera" size={20} color="white" />
                </TouchableOpacity>
            </View>
          </View>

          <View style={{ gap: 20, marginTop: 20 }}>
            <ShareInput
              title="Tên người dùng"
              value={userName}
              onChangeText={setUserName}
              editable={true}
            />
            
            <ShareInput
              title="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={true}
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

  // --- Render Menu Mode ---
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={{ marginRight: 15 }}>
            {renderAvatar(60)}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{appState?.userName || 'Người dùng'}</Text>
          <Text style={styles.profileEmail}>{appState?.email || 'email@example.com'}</Text>
        </View>
        <TouchableOpacity style={styles.updateButton} onPress={() => setIsEditing(true)}>
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
          onPress={() => {}} 
        />
        <SettingItem 
          icon="attach-money" 
          IconComponent={MaterialIcons}
          label="Đơn vị tiền tệ" 
          value="VND"
          rightIcon={false}
          onPress={() => {}} 
        />
      </Section>

      <Section title="Tài khoản">
        <SettingItem 
          icon="lock-closed-outline" 
          label="Thay đổi mật khẩu" 
          onPress={() => setShowChangePassword(true)} 
        />
        <SettingItem 
          icon="log-out-outline" 
          label="Đăng xuất" 
          onPress={handleLogout} 
          rightIcon={false}
        />
      </Section>

      <View style={{ height: 40 }} />

      <ConfirmModal
        visible={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={performLogout}
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?"
        confirmText="Đăng xuất"
        type="danger"
        icon="log-out-outline"
      />

      {/* Change Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showChangePassword}
        onRequestClose={() => setShowChangePassword(false)}
      >
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Thay đổi mật khẩu</Text>
                <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                    <Ionicons name="close-circle" size={28} color="#eee" /> 
                </TouchableOpacity>
            </View>

            <View style={{ gap: 15, marginTop: 10 }}>
                <ShareInput
                    title="Mật khẩu hiện tại"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    securityTextEntry={true}
                />
                <ShareInput
                    title="Mật khẩu mới"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    securityTextEntry={true}
                />
                <ShareInput
                    title="Xác nhận mật khẩu mới"
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    securityTextEntry={true}
                />

                <TouchableOpacity
                    style={[styles.button, styles.saveButton, { marginTop: 20 }]}
                    onPress={handleChangePassword}
                    disabled={isChangingPassword}
                >
                    {isChangingPassword ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Đổi mật khẩu</Text>
                    )}
                </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  
  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    paddingTop: 60, // Safe area top
  },
  profileInfo: {
    flex: 1, marginLeft: 15,
  },
  profileName: {
    fontSize: 18, fontWeight: 'bold', color: '#333',
  },
  profileEmail: {
    fontSize: 14, color: '#666', marginTop: 2,
  },
  updateButton: {
    backgroundColor: APP_COLOR.ORANGE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  updateButtonText: {
    color: 'white', fontWeight: '600', fontSize: 13,
  },

  // Section
  sectionWrapper: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10, marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Item
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemLeft: {
    flexDirection: 'row', alignItems: 'center',
  },
  iconBox: {
    width: 32, alignItems: 'center', marginRight: 12,
  },
  itemLabel: {
    fontSize: 15, color: '#333',
  },
  itemRight: {
    flexDirection: 'row', alignItems: 'center',
  },
  itemValue: {
    fontSize: 14, color: '#999', marginRight: 8,
  },
  destructiveText: {
    color: '#FF3B30',
  },

  // Edit Mode Styles
  editContainer: {
    flex: 1, backgroundColor: 'white',
  },
  editHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, paddingVertical: 15, paddingTop: 50,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  backButton: { padding: 5 },
  editTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  editContent: { padding: 20 },
  center: { alignItems: 'center', marginBottom: 20 },
  avatarContainerLarge: {
    position: 'relative',
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
  },
  cameraButton: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: APP_COLOR.ORANGE, width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white',
  },
  button: {
    padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10,
  },
  saveButton: { backgroundColor: APP_COLOR.ORANGE },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '70%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
});

export default AccountPage;