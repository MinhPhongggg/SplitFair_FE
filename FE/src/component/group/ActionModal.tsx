import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { APP_COLOR } from "@/utils/constant";

interface Props {
  visible: boolean;
  onClose: () => void;
  item: any;
  currentUserId: string | undefined;
  onPay: () => void;
  onRemind: () => void;
}

export const ActionModal = ({
  visible,
  onClose,
  item,
  currentUserId,
  onPay,
  onRemind,
}: Props) => {
  if (!item) return null;
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.actionSheet}>
          <Text style={styles.actionTitle}>Chọn thao tác</Text>
          <Text style={styles.actionSubtitle}>{`${
            item.from
          } trả ${item.amount.toLocaleString("vi-VN")}đ cho ${item.to}`}</Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.payButton]}
            onPress={onPay}
          >
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="white"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.payButtonText}>Xác nhận đã trả</Text>
          </TouchableOpacity>
          {String(currentUserId) === String(item.toId) && (
            <TouchableOpacity
              style={[styles.actionButton, styles.remindButton]}
              onPress={onRemind}
            >
              <Ionicons
                name="notifications"
                size={24}
                color={APP_COLOR.ORANGE}
                style={{ marginRight: 10 }}
              />
              <Text style={styles.remindButtonText}>Gửi lời nhắc nợ</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  actionSheet: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    elevation: 5,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  actionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  payButton: { backgroundColor: APP_COLOR.ORANGE },
  payButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  remindButton: {
    backgroundColor: "#FFF5E5",
    borderWidth: 1,
    borderColor: APP_COLOR.ORANGE,
  },
  remindButtonText: {
    color: APP_COLOR.ORANGE,
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: { paddingVertical: 10 },
  cancelButtonText: { color: "#999", fontSize: 16 },
});
