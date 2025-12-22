import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Share,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { APP_COLOR } from "@/utils/constant";
import { User } from "@/types/user.types";
import Avatar from "@/component/Avatar";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";

interface Props {
  visible: boolean;
  onClose: () => void;
  query: string;
  setQuery: (text: string) => void;
  users: User[] | undefined;
  isSearching: boolean;
  onAddMember: (user: User) => void;
  isAdding: boolean;
  groupId: string;
  showToast: (type: string, title: string, msg: string) => void; // Truyền hàm toast vào
}

export const AddMemberModal = ({
  visible,
  onClose,
  query,
  setQuery,
  users,
  isSearching,
  onAddMember,
  isAdding,
  groupId,
  showToast,
}: Props) => {
  const [addMemberTab, setAddMemberTab] = useState<"search" | "invite">(
    "search"
  );
  const inviteLink = `splitfair://join-group?groupId=${groupId}`;

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(inviteLink);
    showToast(
      "success",
      "Đã sao chép",
      "Link tham gia đã được lưu vào bộ nhớ tạm"
    );
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Tham gia nhóm chi tiêu của tôi trên SplitFair: ${inviteLink}`,
      });
    } catch (error: any) {
      showToast("error", "Lỗi", error.message);
    }
  };

  const renderSearchResultItem = ({ item }: { item: User }) => (
    <View style={styles.resultItem}>
      <Avatar name={item.name} avatar={item.avatar} />
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity
        onPress={() => onAddMember(item)}
        disabled={isAdding}
        style={styles.addButtonSmall}
      >
        {isAdding ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.addButtonSmallText}>Thêm</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thêm thành viên</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#eee" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                addMemberTab === "search" && styles.activeTabBtn,
              ]}
              onPress={() => setAddMemberTab("search")}
            >
              <Text
                style={[
                  styles.tabText,
                  addMemberTab === "search" && styles.activeTabText,
                ]}
              >
                Tìm kiếm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                addMemberTab === "invite" && styles.activeTabBtn,
              ]}
              onPress={() => setAddMemberTab("invite")}
            >
              <Text
                style={[
                  styles.tabText,
                  addMemberTab === "invite" && styles.activeTabText,
                ]}
              >
                Mã QR & Link
              </Text>
            </TouchableOpacity>
          </View>

          {addMemberTab === "search" ? (
            <>
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#888"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Nhập email hoặc tên..."
                  placeholderTextColor="#999"
                  autoFocus={false}
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery("")}>
                    <Ionicons name="close-circle" size={18} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.resultsContainer}>
                {isSearching ? (
                  <ActivityIndicator
                    color={APP_COLOR.ORANGE}
                    style={{ marginTop: 20 }}
                  />
                ) : (
                  <FlatList
                    data={users || []}
                    renderItem={renderSearchResultItem}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={
                      query.length >= 2 ? (
                        <Text style={styles.hintText}>
                          Không tìm thấy người dùng này.
                        </Text>
                      ) : (
                        <View style={styles.searchPlaceholder}>
                          <Ionicons
                            name="people-outline"
                            size={48}
                            color="#eee"
                          />
                          <Text style={styles.hintText}>
                            Nhập tối thiểu 2 ký tự để tìm kiếm
                          </Text>
                        </View>
                      )
                    }
                    keyboardShouldPersistTaps="handled"
                  />
                )}
              </View>
            </>
          ) : (
            <View style={styles.inviteTabContainer}>
              <Text style={styles.inviteSubtitle}>
                Quét mã QR hoặc chia sẻ link để mời bạn bè.
              </Text>
              <View style={styles.qrContainer}>
                <QRCode
                  value={inviteLink}
                  size={160}
                  color="black"
                  backgroundColor="white"
                />
              </View>
              <View style={styles.linkContainer}>
                <Text
                  style={styles.linkText}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {inviteLink}
                </Text>
                <TouchableOpacity
                  onPress={copyToClipboard}
                  style={styles.copyBtn}
                >
                  <Ionicons
                    name="copy-outline"
                    size={20}
                    color={APP_COLOR.ORANGE}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
                <Ionicons
                  name="share-social-outline"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.shareBtnText}>Chia sẻ Link</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Copy y nguyên styles modal từ file gốc
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 15,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 15,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTabBtn: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontSize: 14, color: "#888", fontWeight: "600" },
  activeTabText: { color: APP_COLOR.ORANGE, fontWeight: "bold" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 50,
    marginBottom: 15,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: "#333", height: "100%" },
  resultsContainer: { flex: 1 },
  searchPlaceholder: { alignItems: "center", marginTop: 60, gap: 15 },
  hintText: { textAlign: "center", color: "gray" },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  resultInfo: { flex: 1, marginLeft: 0 },
  resultName: { fontSize: 16, fontWeight: "600" },
  resultEmail: { fontSize: 13, color: "gray" },
  addButtonSmall: {
    backgroundColor: "#E0EFFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  addButtonSmallText: { color: "#007AFF", fontWeight: "600", fontSize: 12 },
  inviteTabContainer: { flex: 1, alignItems: "center", paddingTop: 10 },
  inviteSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  qrContainer: {
    padding: 15,
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 20,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    width: "100%",
  },
  linkText: { flex: 1, color: "#555", fontSize: 13, marginRight: 10 },
  copyBtn: { padding: 5 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APP_COLOR.ORANGE,
    borderRadius: 12,
    paddingVertical: 12,
    width: "100%",
  },
  shareBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
