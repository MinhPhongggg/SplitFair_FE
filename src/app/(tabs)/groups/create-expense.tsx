// src/app/(tabs)/groups/create-expense.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { APP_COLOR } from '@/utils/constant';
import {
  useCreateExpense,
  useGetGroupMembers,
  useSaveExpenseShares,
} from '@/api/hooks';
import { useCurrentApp } from '@/context/app.context';
import { useToast } from '@/context/toast.context';
import { ExpenseShareSaveRequest, ShareInput } from '@/types/expense.types';
import Ionicons from '@expo/vector-icons/Ionicons';

type SplitMethod = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';

interface SplitInput {
  userId: string;
  name: string;
  value: string;
  isChecked: boolean;
}

const SPLIT_METHODS: { label: string; value: SplitMethod }[] = [
  { label: 'Chia đều (EQUAL)', value: 'EQUAL' },
  { label: 'Chia theo số tiền (EXACT)', value: 'EXACT' },
  { label: 'Chia theo phần trăm (%)', value: 'PERCENTAGE' },
  { label: 'Chia theo phần (SHARES)', value: 'SHARES' },
];

// --- Component Modal Chọn (Bottom Sheet) ---
const SelectionModal = ({
  visible,
  onClose,
  title,
  options,
  onSelect,
  selectedValue,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  selectedValue: string;
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{title}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      item.value === selectedValue && styles.optionItemSelected,
                    ]}
                    onPress={() => {
                      onSelect(item.value);
                      onClose();
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        item.value === selectedValue && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.value === selectedValue && (
                      <Ionicons name="checkmark-circle" size={24} color={APP_COLOR.ORANGE} />
                    )}
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 400 }}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const CreateExpenseScreen = () => {
  const { billId, groupId } = useLocalSearchParams<{
    billId: string;
    groupId: string;
  }>();
  const { appState } = useCurrentApp();
  const { showToast } = useToast();

  // --- State Form ---
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('EQUAL');
  const [splitInputs, setSplitInputs] = useState<SplitInput[]>([]);

  // --- State Modal ---
  const [showPayerModal, setShowPayerModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);

  // --- API ---

  // --- API ---
  const { data: members, isLoading: isLoadingMembers } = useGetGroupMembers(
    groupId as string
  );
  const { mutate: createExpense, isPending: isCreatingExpense } =
    useCreateExpense(billId as string);
  const { mutate: saveShares, isPending: isSavingShares } =
    useSaveExpenseShares(groupId as string);
  
  const isPending = isCreatingExpense || isSavingShares;

  // --- Helpers ---
  const getMemberName = (m: any) => m.userName || m.user?.userName || 'Thành viên';
  const getMemberId = (m: any) => m.userId || m.user?.id || '';

  // --- Options cho Modal ---
  const memberOptions = useMemo(() => {
    return members?.map(m => ({
      label: getMemberName(m),
      value: getMemberId(m)
    })) || [];
  }, [members]);

  // --- Init Data ---
  useEffect(() => {
    if (members) {
      // Set default payer là current user nếu có trong list
      const currentUserId = appState?.userId ? String(appState.userId) : '';
      const isMember = members.some(m => getMemberId(m) === currentUserId);
      if (isMember && !paidBy) {
        setPaidBy(currentUserId);
      } else if (members.length > 0 && !paidBy) {
        setPaidBy(getMemberId(members[0]));
      }

      setSplitInputs(
        members.map((m) => ({
          userId: getMemberId(m),
          name: getMemberName(m),
          value: splitMethod === 'SHARES' ? '1' : '0',
          isChecked: true,
        }))
      );
    }
  }, [members]);

  // --- Logic Tính Toán ---
  const { calculatedShares, totalCalculated, isValid } = useMemo(() => {
    const totalAmountNum = parseFloat(amount) || 0;
    const participatingMembers = splitInputs.filter(m => m.isChecked);
    const memberCount = participatingMembers.length || 1;

    let totalCalculated = 0;

    const calculatedShares = splitInputs.map((input) => {
      if (!input.isChecked) {
        return { ...input, calculatedAmount: 0 };
      }

      let calculatedAmount = 0;
      switch (splitMethod) {
        case 'EQUAL':
          const splitAmount = Math.floor((totalAmountNum / memberCount) * 100) / 100;
          const participatingIndex = participatingMembers.findIndex(m => m.userId === input.userId);
          if (participatingIndex === memberCount - 1) {
            calculatedAmount = totalAmountNum - totalCalculated;
          } else {
            calculatedAmount = splitAmount;
          }
          break;

        case 'EXACT':
          calculatedAmount = parseFloat(input.value) || 0;
          break;

        case 'PERCENTAGE':
          const percent = parseFloat(input.value) || 0;
          calculatedAmount = (totalAmountNum * percent) / 100;
          break;

        case 'SHARES':
          const totalShares = participatingMembers.reduce(
            (sum, i) => sum + (parseFloat(i.value) || 0),
            0
          );
          if (totalShares === 0) {
            calculatedAmount = 0;
          } else {
            const portion = parseFloat(input.value) || 0;
            calculatedAmount = (totalAmountNum * portion) / totalShares;
          }
          break;
      }
      totalCalculated += calculatedAmount;
      return { ...input, calculatedAmount };
    });

    totalCalculated = parseFloat(totalCalculated.toFixed(2));
    const isValid = Math.abs(totalCalculated - totalAmountNum) < 1;

    return { calculatedShares, totalCalculated, isValid };
  }, [amount, splitMethod, splitInputs]);

  // --- Handlers ---
  const handleToggleCheck = (userId: string) => {
    setSplitInputs((prev) =>
      prev.map((input) =>
        input.userId === userId ? { ...input, isChecked: !input.isChecked } : input
      )
    );
  };

  const handleSplitInputChange = (userId: string, value: string) => {
    setSplitInputs((prev) =>
      prev.map((input) =>
        input.userId === userId ? { ...input, value } : input
      )
    );
  };

  const handleMethodChange = (method: string) => {
    const newMethod = method as SplitMethod;
    setSplitMethod(newMethod);
    setSplitInputs((prev) =>
      prev.map((input) => ({
        ...input,
        value: newMethod === 'SHARES' ? '1' : (newMethod === 'PERCENTAGE' ? '0' : input.value),
      }))
    );
  };

  const handleCreate = () => {
    const participatingMembers = splitInputs.filter(m => m.isChecked);
    if (participatingMembers.length === 0) {
      showToast('warning', 'Chưa chọn thành viên', 'Bạn phải chọn ít nhất một người để chia');
      return;
    }

    if (!description || !amount || !paidBy) {
      showToast('warning', 'Thiếu thông tin', 'Vui lòng điền mô tả, số tiền và người trả');
      return;
    }
    if (!isValid) {
      showToast(
        'error',
        'Lỗi chia tiền',
        `Tổng đã chia (${totalCalculated.toLocaleString('vi-VN')}đ) không khớp tổng chi tiêu`
      );
      return;
    }

    createExpense(
      {
        billId: billId as string,
        groupId: groupId as string,
        description: description,
        amount: parseFloat(amount),
        paidBy: paidBy,
        createdBy: appState?.userId ? String(appState.userId) : '',
        userId: paidBy,
        status: 'PENDING',
      },
      {
        onSuccess: (newExpense) => {
          const sharesForApi: ShareInput[] = calculatedShares
            .filter(share => share.isChecked)
            .map((share) => ({
              userId: share.userId,
              shareAmount: share.calculatedAmount,
              percentage: splitMethod === 'PERCENTAGE' ? (parseFloat(share.value) || 0) : 0,
            }));

          const shareRequest: ExpenseShareSaveRequest = {
            expenseId: newExpense.id,
            totalAmount: newExpense.amount,
            paidBy: newExpense.paidBy,
            shares: sharesForApi,
            currency: 'VND',
          };

          saveShares(shareRequest, {
            onSuccess: () => {
              showToast('success', 'Thành công', 'Đã thêm và chia chi tiêu mới.');
              router.back();
            },
            onError: (err: any) => {
              showToast('error', 'Lỗi lưu chia tiền', err.response?.data?.message || err.message);
            },
          });
        },
        onError: (err: any) => {
          showToast('error', 'Lỗi tạo chi tiêu', err.response?.data?.message || err.message);
        },
      }
    );
  };

  if (isLoadingMembers) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={APP_COLOR.ORANGE} />
      </View>
    );
  }

  const renderSplitInput = (item: SplitInput) => {
    const calculated = calculatedShares.find(c => c.userId === item.userId);
    const calculatedAmount = calculated?.calculatedAmount || 0;
    const isEditable = splitMethod !== 'EQUAL';
    const itemStyle = !item.isChecked ? styles.splitItemDisabled : null;

    return (
      <View style={[styles.splitItem, itemStyle]} key={item.userId}>
        <TouchableOpacity onPress={() => handleToggleCheck(item.userId)}>
          <Ionicons
            name={item.isChecked ? 'checkbox' : 'checkbox-outline'}
            size={24}
            color={item.isChecked ? APP_COLOR.ORANGE : '#aaa'}
            style={{ marginRight: 10 }}
          />
        </TouchableOpacity>
        
        <Text style={[styles.splitName, itemStyle]} numberOfLines={1}>{item.name}</Text>
        
        {isEditable && (
          <TextInput
            style={[styles.splitInput, itemStyle]}
            value={item.value}
            onChangeText={(text) => handleSplitInputChange(item.userId, text)}
            keyboardType="numeric"
            editable={item.isChecked}
            placeholder="0"
          />
        )}
        <Text style={[styles.splitAmount, itemStyle]}>
          {calculatedAmount.toLocaleString('vi-VN')}đ
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm chi tiêu mới</Text>
        <View style={{ width: 34 }} /> 
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            {/* --- Thông tin cơ bản --- */}
            <Text style={[styles.label, styles.labelFirst]}>Mô tả chi tiêu (*)</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="create-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Ví dụ: Tiền lẩu"
                />
            </View>

            <Text style={styles.label}>Số tiền (*)</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="cash-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0"
                    keyboardType="numeric"
                />
                <Text style={styles.currencySuffix}>₫</Text>
            </View>

            <Text style={styles.label}>Người trả tiền (*)</Text>
            <TouchableOpacity 
              style={styles.pickerWrapper} 
              onPress={() => setShowPayerModal(true)}
            >
                <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                <View style={styles.pickerContainer}>
                    <Text style={styles.pickerText}>
                      {memberOptions.find(m => m.value === paidBy)?.label || 'Chọn người trả'}
                    </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#888" />
            </TouchableOpacity>

            {/* --- Phần chia tiền --- */}
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Chia tiền</Text>

            <Text style={styles.label}>Phương thức chia (*)</Text>
            <TouchableOpacity 
              style={styles.pickerWrapper} 
              onPress={() => setShowMethodModal(true)}
            >
                <Ionicons name="options-outline" size={20} color="#888" style={styles.inputIcon} />
                <View style={styles.pickerContainer}>
                    <Text style={styles.pickerText}>
                      {SPLIT_METHODS.find(m => m.value === splitMethod)?.label}
                    </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#888" />
            </TouchableOpacity>

            <View style={styles.splitContainer}>
                {splitInputs.map(renderSplitInput)}
            </View>

            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng đã chia:</Text>
                <Text style={[styles.totalValue, !isValid && styles.totalError]}>
                    {totalCalculated.toLocaleString('vi-VN')}đ
                </Text>
            </View>
            {!isValid && (
                <Text style={styles.errorText}>
                    Tổng chia không khớp với số tiền ({parseFloat(amount || '0').toLocaleString('vi-VN')}đ)
                </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleCreate}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Lưu Chi Tiêu</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- Modals --- */}
      <SelectionModal
        visible={showPayerModal}
        onClose={() => setShowPayerModal(false)}
        title="Chọn người trả tiền"
        options={memberOptions}
        onSelect={setPaidBy}
        selectedValue={paidBy}
      />

      <SelectionModal
        visible={showMethodModal}
        onClose={() => setShowMethodModal(false)}
        title="Chọn phương thức chia"
        options={SPLIT_METHODS}
        onSelect={handleMethodChange}
        selectedValue={splitMethod}
      />
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  scrollContent: { padding: 20 },

  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 15,
    textTransform: 'uppercase',
  },
  labelFirst: { marginTop: 0 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 20,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333', height: '100%' },
  currencySuffix: { fontSize: 16, fontWeight: 'bold', color: '#888', marginLeft: 5 },

  // Picker Replacement Styles
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  pickerContainer: { flex: 1, justifyContent: 'center' },
  pickerText: { fontSize: 16, color: '#333' },

  // Split Styles
  splitContainer: { marginTop: 10 },
  splitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  splitItemDisabled: { opacity: 0.5 },
  splitName: { flex: 2, fontSize: 15, color: '#333' },
  splitInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    textAlign: 'right',
    marginRight: 10,
    fontSize: 14,
    color: '#333',
  },
  splitAmount: {
    flex: 1.5,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    color: '#333',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 10,
  },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#666' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: APP_COLOR.ORANGE },
  totalError: { color: 'red' },
  errorText: { color: 'red', fontSize: 12, textAlign: 'right', marginTop: 4 },

  button: {
    backgroundColor: APP_COLOR.ORANGE,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: APP_COLOR.ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    elevation: 5,
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  optionItemSelected: {
    backgroundColor: '#FFF5E5',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: APP_COLOR.ORANGE,
    fontWeight: 'bold',
  },
});

export default CreateExpenseScreen;