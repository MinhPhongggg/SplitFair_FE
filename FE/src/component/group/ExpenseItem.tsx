import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Expense } from "@/types/expense.types";

interface Props {
  item: Expense; // 👈 Nhận nguyên object Expense
  payerName: string;
  onPress: (id: string) => void;
}

export const ExpenseItem = ({ item, payerName, onPress }: Props) => {
  const date = new Date(item.createdTime);

  return (
    <TouchableOpacity
      style={styles.expenseItem}
      onPress={() => onPress(item.id)}
    >
      <View style={styles.dateBox}>
        <Text style={styles.dateMonth}>
          T{(date.getMonth() + 1).toString().padStart(2, "0")}
        </Text>
        <Text style={styles.dateDay}>{date.getDate()}</Text>
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseName} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={styles.expensePayer}>{payerName} đã trả</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.expenseAmount}>
          {item.amount.toLocaleString("vi-VN")}đ
        </Text>
        <Text style={styles.expenseSub}>chi tiêu</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  expenseItem: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dateBox: {
    backgroundColor: "#F5F7FA",
    padding: 8,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 12,
    width: 50,
  },
  dateMonth: { fontSize: 10, color: "#888", fontWeight: "700" },
  dateDay: { fontSize: 16, fontWeight: "bold", color: "#333" },
  expenseInfo: { flex: 1 },
  expenseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  expensePayer: { fontSize: 12, color: "gray" },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "right",
  },
  expenseSub: { fontSize: 10, color: "gray", textAlign: "right" },
});
