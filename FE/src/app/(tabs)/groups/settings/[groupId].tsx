// src/app/(tabs)/groups/settings/[groupId].tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useGetGroupById, useUpdateGroup, useDeleteGroup, useGetGroupMembers, useRemoveMember, useGetGroupBalances } from "@/api/hooks";
import { APP_COLOR } from "@/utils/constant";
import { useToast } from "@/context/toast.context";
import Ionicons from "@expo/vector-icons/Ionicons";
import ConfirmModal from "@/component/ConfirmModal";
import { useCurrentApp } from "@/context/app.context";
import { Alert } from "react-native";

const GroupSettingsScreen = () => {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { appState } = useCurrentApp();
  const currentUserId = appState?.userId;

  // 1. Lấy thông tin nhóm hiện tại
  const { data: group, isLoading } = useGetGroupById(groupId as string);
  const { data: members } = useGetGroupMembers(groupId as string);
  const { data: balances } = useGetGroupBalances(groupId as string);

  // 2. State cho form
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 3. Hook update & delete
  const { mutate: updateGroup, isPending: isUpdating } = useUpdateGroup();
  const { mutate: deleteGroup, isPending: isDeleting } = useDeleteGroup();
  const { mutate: removeMember, isPending: isLeaving } = useRemoveMember(groupId as string);

  // Điền dữ liệu khi tải xong
  useEffect(() => {
    if (group) {
      setGroupName(group.groupName);
      setDescription(group.description || "");
    }
  }, [group]);

  const handleSave = () => {
    if (!groupName.trim()) {
      showToast("warning", "Thiếu thông tin", "Tên nhóm không được để trống");
      return;
    }

    updateGroup(
      {
        groupId: groupId as string,
        dto: { groupName, description },
      },
      {
        onSuccess: () => {
          showToast("success", "Thành công", "Đã cập nhật thông tin nhóm.");
          router.back(); // Quay lại trang chi tiết
        },
        onError: (err) => {
          showToast("error", "Lỗi", err.message || "Không thể cập nhật nhóm");
        },
      }
    );
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const performDelete = () => {
    deleteGroup(groupId as string, {
      onSuccess: () => {
        showToast("success", "Thành công", "Đã xóa nhóm.");
        router.replace("/(tabs)/groups"); // Quay về danh sách nhóm
      },
      onError: (err) => {
        showToast("error", "Lỗi", err.message || "Không thể xóa nhóm");
      },
    });
  };

  const handleLeaveGroup = () => {
    // Find my member ID
    const myMember = members?.find(m => m.userId === currentUserId || m.user?.id === currentUserId);
    if (!myMember) {
        showToast("error", "Lỗi", "Không tìm thấy thông tin thành viên của bạn.");
        return;
    }

    // Check debts
    const myBalance = balances?.find(b => b.userId === currentUserId);
    const amount = parseFloat(myBalance?.netAmount || "0");
    
    // Cho phép sai số nhỏ
    if (Math.abs(amount) > 100) {
         showToast("error", "Không thể rời nhóm", "Bạn cần thanh toán hết nợ (hoặc thu hồi nợ) trước khi rời nhóm.");
         return;
    }

    Alert.alert(
        "Rời nhóm",
        "Bạn có chắc chắn muốn rời khỏi nhóm này?",
        [
            { text: "Hủy", style: "cancel" },
            { 
                text: "Rời nhóm", 
                style: "destructive", 
                onPress: () => {
                    removeMember({ memberId: myMember.id }, {
                        onSuccess: () => {
                            showToast("success", "Thành công", "Đã rời nhóm.");
                            router.replace("/(tabs)/groups");
                        },
                        onError: (err) => {
                            showToast("error", "Lỗi", err.message || "Không thể rời nhóm");
                        }
                    });
                }
            }
        ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={APP_COLOR.ORANGE} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

      {/* --- Custom Header --- */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt nhóm</Text>
        <View style={{ width: 34 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={[styles.label, styles.labelFirst]}>Tên nhóm</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="people-outline"
                size={20}
                color="#888"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Nhập tên nhóm..."
                placeholderTextColor="#999"
              />
            </View>

            <Text style={styles.label}>Mô tả</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#888"
                style={[styles.inputIcon, { marginTop: 12 }]}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Mô tả nhóm (tùy chọn)..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isUpdating && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isUpdating || isDeleting || isLeaving}
          >
            {isUpdating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Lưu Thay Đổi</Text>
            )}
          </TouchableOpacity>

          {group?.createdBy === currentUserId ? (
            <TouchableOpacity
                style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
                onPress={handleDelete}
                disabled={isUpdating || isDeleting || isLeaving}
            >
                {isDeleting ? (
                <ActivityIndicator color="#FF3B30" />
                ) : (
                <Text style={styles.deleteButtonText}>Xóa Nhóm</Text>
                )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
                style={[styles.deleteButton, isLeaving && styles.buttonDisabled]}
                onPress={handleLeaveGroup}
                disabled={isUpdating || isDeleting || isLeaving}
            >
                {isLeaving ? (
                <ActivityIndicator color="#FF3B30" />
                ) : (
                <Text style={styles.deleteButtonText}>Rời Nhóm</Text>
                )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={performDelete}
        title="Xóa nhóm"
        message="Bạn có chắc chắn muốn xóa nhóm này không?"
        subMessage="Hành động này không thể hoàn tác."
        confirmText="Xóa Nhóm"
        type="danger"
        variant="material"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#F2F2F7",
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },

  scrollContent: { padding: 20 },

  // Card
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    marginTop: 15,
    textTransform: "uppercase",
  },
  labelFirst: { marginTop: 0 },

  // Input
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  textAreaContainer: {
    height: 120,
    alignItems: "flex-start",
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    height: "100%",
  },
  textArea: {
    paddingTop: 12,
    textAlignVertical: "top",
  },

  // Button
  button: {
    backgroundColor: APP_COLOR.ORANGE,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: APP_COLOR.ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 15,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },

  // Delete Button
  deleteButton: {
    backgroundColor: "#FFF0F0",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  deleteButtonText: { color: "#FF3B30", fontSize: 18, fontWeight: "bold" },
});

export default GroupSettingsScreen;
