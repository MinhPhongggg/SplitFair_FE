import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { APP_COLOR } from "@/utils/constant";
import { pickImage, takePhoto, scanReceipt } from "@/api/ocr";

// 1. Import Hook
import { useExpenseCreation } from "@/hooks/useExpenseCreation";

// 2. Import Components
import { PayerAmountSection } from "@/component/expense/PayerAmountSection";
import { SplitMethodTabs } from "@/component/expense/SplitMethodTabs";
import { SplitList } from "@/component/expense/SplitList";
import { SelectionModal } from "@/component/expense/SelectionModal";

const CreateExpenseScreen = () => {
  const { billId, groupId } = useLocalSearchParams<{
    billId: string;
    groupId: string;
  }>();

  const {
    members,
    isLoadingMembers,
    isPending,
    form,
    setters,
    logic,
    calc,
    helpers,
  } = useExpenseCreation(groupId, billId);

  const [showPayerModal, setShowPayerModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    Alert.alert("Quét hóa đơn", "Chọn phương thức", [
      {
        text: "Chụp ảnh",
        onPress: async () => {
          const uri = await takePhoto();
          if (uri) processImage(uri);
        },
      },
      {
        text: "Chọn từ thư viện",
        onPress: async () => {
          const uri = await pickImage();
          if (uri) processImage(uri);
        },
      },
      { text: "Hủy", style: "cancel" },
    ]);
  };

  const processImage = async (uri: string) => {
    setIsScanning(true);
    try {
      const amount = await scanReceipt(uri);
      if (amount) {
        // FIX: Định dạng số thô từ OCR (vd: "500000") thành số có dấu chấm ("500.000")
        const formattedAmount = calc.formatNumber(amount);
        setters.setAmount(formattedAmount);

        Alert.alert("Thành công", `Đã quét được số tiền: ${formattedAmount}đ`);
      } else {
        Alert.alert("Thất bại", "Không tìm thấy số tiền trong hóa đơn");
      }
    } catch (error: any) {
      console.error("OCR Error:", error);
      Alert.alert("Lỗi", "Không thể kết nối tới máy chủ OCR");
    } finally {
      setIsScanning(false);
    }
  };

  if (isLoadingMembers) {
    return (
      <ActivityIndicator
        size="large"
        color={APP_COLOR.ORANGE}
        style={styles.center}
      />
    );
  }

  const payerMember = members?.find(
    (m) => helpers.getMemberId(m) === form.paidBy
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm chi tiêu</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.descriptionContainer}>
            <Ionicons
              name="document-text-outline"
              size={24}
              color="#666"
              style={styles.descIcon}
            />
            <TextInput
              style={styles.descriptionInput}
              value={form.description}
              onChangeText={setters.setDescription}
              placeholder="Nhập mô tả (ví dụ: Ăn tối)"
              placeholderTextColor="#999"
            />
          </View>

          <PayerAmountSection
            payerName={
              payerMember ? helpers.getMemberName(payerMember) : "Chọn người"
            }
            payerAvatar={payerMember?.user?.avatar || undefined}
            onPressPayer={() => setShowPayerModal(true)}
            amount={form.amount}
            setAmount={setters.setAmount}
            onScan={handleScan}
          />

          {isScanning && (
            <ActivityIndicator
              size="large"
              color={APP_COLOR.ORANGE}
              style={{ marginVertical: 10 }}
            />
          )}

          <SplitMethodTabs
            current={form.splitMethod}
            onChange={logic.changeMethod}
          />

          <SplitList
            inputs={calc.calculatedShares}
            splitMethod={form.splitMethod}
            onToggle={logic.toggleCheck}
            onInput={logic.updateInput}
            getAvatar={(id) =>
              members?.find((m) => helpers.getMemberId(m) === id)?.user
                ?.avatar || null
            }
          />
        </ScrollView>

        <View style={styles.fixedFooter}>
          <View style={styles.totalInfoContainer}>
            <Text style={styles.totalLabelFooter}>Tổng đã chia:</Text>
            <Text
              style={[
                styles.totalValueFooter,
                !calc.isValid && styles.totalError,
              ]}
            >
              {calc.totalCalculated.toLocaleString("vi-VN")}đ
            </Text>
          </View>
          {!calc.isValid && (
            <Text style={styles.errorTextFooter}>
              Còn thiếu:{" "}
              {(
                parseFloat(calc.unformatNumber(form.amount) || "0") -
                calc.totalCalculated
              ).toLocaleString("vi-VN")}
              đ
            </Text>
          )}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!calc.isValid || isPending) && styles.saveButtonDisabled,
            ]}
            onPress={logic.submit}
            disabled={!calc.isValid || isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonLabel}>Lưu chi tiêu</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <SelectionModal
        visible={showPayerModal}
        onClose={() => setShowPayerModal(false)}
        title="Chọn người trả tiền"
        options={
          members?.map((m) => ({
            label: helpers.getMemberName(m),
            value: helpers.getMemberId(m),
          })) || []
        }
        onSelect={setters.setPaidBy}
        selectedValue={form.paidBy}
      />
    </SafeAreaView>
  );
};

// ... Styles giữ nguyên như file cũ của bạn
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  scrollContent: { paddingBottom: 40 },
  descriptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  descIcon: { marginRight: 10 },
  descriptionInput: { flex: 1, fontSize: 18, color: "#333" },
  fixedFooter: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    elevation: 10,
  },
  totalInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  totalLabelFooter: { fontSize: 16, color: "#666" },
  totalValueFooter: {
    fontSize: 24,
    fontWeight: "bold",
    color: APP_COLOR.ORANGE,
  },
  totalError: { color: "red" },
  errorTextFooter: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: APP_COLOR.ORANGE,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  saveButtonDisabled: { backgroundColor: "#ccc" },
  saveButtonLabel: { color: "white", fontSize: 18, fontWeight: "bold" },
});

export default CreateExpenseScreen;
