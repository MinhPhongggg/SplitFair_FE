import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Avatar from "@/component/Avatar";

interface Props {
  item: any;
  onPress: () => void;
  getAvatar: (id: string) => string | undefined;
}

export const DebtSuggestionItem = ({ item, onPress, getAvatar }: Props) => {
  return (
    <TouchableOpacity style={styles.suggestionItem} onPress={onPress}>
      <View style={styles.suggestionRow}>
        <View style={{ width: 60, height: 36, marginRight: 5 }}>
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
        </View>
        <Text style={styles.suggestionAmount}>
          {item.amount.toLocaleString("vi-VN")}đ
        </Text>
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
    marginLeft: 10,
  },
  suggestionText: { fontSize: 14, color: "#666" },
});
