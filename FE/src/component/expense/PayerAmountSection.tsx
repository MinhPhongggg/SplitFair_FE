import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Avatar from "@/component/Avatar";
import { APP_COLOR } from "@/utils/constant";

interface Props {
  payerName: string;
  payerAvatar?: string;
  onPressPayer: () => void;
  amount: string;
  setAmount: (val: string) => void;
  onScan?: () => void;
}

export const PayerAmountSection = ({
  payerName,
  payerAvatar,
  onPressPayer,
  amount,
  setAmount,
  onScan,
}: Props) => {
  // Hàm loại bỏ dấu phân cách để lấy số nguyên thuần túy
  const unformatNumber = (val: string) => {
    if (!val) return "";
    return val.toString().replace(/\./g, "").replace(/[^0-9]/g, "");
  };

  // Hàm format số theo chuẩn vi-VN (dấu chấm phân cách hàng nghìn)
  const formatNumber = (val: string | number) => {
    if (val === "" || val === undefined || val === null) return "";
    const cleanStr = unformatNumber(val.toString());
    if (cleanStr === "") return "";
    return new Intl.NumberFormat("vi-VN").format(parseInt(cleanStr));
  };

  return (
    <View style={styles.payerAmountSection}>
      <View style={styles.payerRow}>
        <Text style={styles.sectionLabel}>Người trả tiền</Text>
        <TouchableOpacity style={styles.payerSelector} onPress={onPressPayer}>
          <Avatar name={payerName} avatar={payerAvatar} size={24} />
          <Text style={styles.payerName}>{payerName}</Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>
      </View>
      <View style={styles.amountRow}>
        <TextInput
          style={styles.largeAmountInput}
          value={formatNumber(amount)}
          onChangeText={(text) => {
            const cleanValue = text.replace(/\./g, "");
            if (/^\d*$/.test(cleanValue)) {
              setAmount(cleanValue);
            }
          }}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor="#ccc"
        />
        <Text style={styles.currencySymbol}>₫</Text>
      </View>
      {onScan && (
        <TouchableOpacity style={styles.scanButton} onPress={onScan}>
          <Ionicons name="scan-outline" size={20} color={APP_COLOR.ORANGE} />
          <Text style={styles.scanText}>Quét hóa đơn</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  payerAmountSection: { padding: 20, backgroundColor: "#fff" },
  payerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  payerSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  payerName: {
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  currencySymbol: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#333",
    marginRight: 5,
  },
  largeAmountInput: {
    fontSize: 40,
    fontWeight: "bold",
    color: APP_COLOR.ORANGE,
    minWidth: 100,
    textAlign: "center",
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    padding: 8,
    backgroundColor: "#FFF5F0",
    borderRadius: 8,
    alignSelf: "center",
  },
  scanText: {
    marginLeft: 6,
    color: APP_COLOR.ORANGE,
    fontWeight: "600",
    fontSize: 14,
  },
});
