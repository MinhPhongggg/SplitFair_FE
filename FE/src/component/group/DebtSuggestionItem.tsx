import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Avatar from "@/component/Avatar";
import { APP_COLOR } from "@/utils/constant";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
  item: any;
  onPress: () => void;
  onPay?: () => void;
  onRemind?: () => void;
  getAvatar: (id: string) => string | undefined;
  currentUserId?: string;
}

export const DebtSuggestionItem = ({
  item,
  onPress,
  onPay,
  onRemind,
  getAvatar,
  currentUserId,
}: Props) => {
  const isPayer = currentUserId === item.fromId;
  const isPayee = currentUserId === item.toId;

  return (
    <TouchableOpacity style={styles.suggestionItem} onPress={onPress}>
      <View style={styles.suggestionRow}>
        <View style={{ width: 60, height: 36, marginRight: 10 }}>
          <View style={{ position: "absolute", left: 0, zIndex: 2 }}>
            <Avatar
              name={item.from}
              avatar={getAvatar(item.fromId)}
              size={36}
              style={{ marginRight: 0 }}
            />
          </View>
          <View style={{ position: "absolute", left: 20, zIndex: 1 }}>
            <View
              style={{ borderWidth: 2, borderColor: "white", borderRadius: 18 }}
            >
              <Avatar
                name={item.to}
                avatar={getAvatar(item.toId)}
                size={36}
                style={{ marginRight: 0 }}
              />
            </View>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={styles.suggestionText} numberOfLines={1}>
            <Text style={{ fontWeight: "bold", color: "#333" }}>
              {item.from}
            </Text>
            <Text> trả </Text>
            <Text style={{ fontWeight: "bold", color: "#333" }}>{item.to}</Text>
          </Text>
          <Text style={styles.suggestionAmount}>
            {item.amount.toLocaleString("vi-VN")}đ
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {isPayer && onPay && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: APP_COLOR.GREEN }]}
              onPress={onPay}
            >
              <Text style={styles.actionButtonText}>Trả</Text>
            </TouchableOpacity>
          )}
          {isPayee && onRemind && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: APP_COLOR.ORANGE }]}
              onPress={onRemind}
            >
              <Text style={styles.actionButtonText}>Nhắc</Text>
            </TouchableOpacity>
          )}
          {!isPayer && !isPayee && (
             <Ionicons name="chevron-forward" size={20} color="#ccc" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  suggestionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  suggestionRow: { flexDirection: "row", alignItems: "center" },
  suggestionAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FF3B30",
    marginTop: 2,
  },
  suggestionText: { fontSize: 14, color: "#666" },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 8,
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
