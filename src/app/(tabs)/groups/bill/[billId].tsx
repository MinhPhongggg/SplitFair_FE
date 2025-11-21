// src/app/(tabs)/groups/bill/[billId].tsx
import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { APP_COLOR } from '@/utils/constant';
import {
  useGetBillById,
  useGetExpensesByBill,
  useDeleteExpense,
  useDeleteBill,
  useGetGroupMembers,
} from '@/api/hooks';
import { Expense } from '@/types/expense.types';
import { useToast } from '@/context/toast.context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Swipeable } from 'react-native-gesture-handler';
import ConfirmModal from '@/component/ConfirmModal';

const BillDetailScreen = () => {
  const { billId } = useLocalSearchParams<{ billId: string }>();
  const navigation = useNavigation();
  const { showToast } = useToast();

  const [confirmModal, setConfirmModal] = React.useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'info';
    confirmText?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info',
  });

  const { data: bill, isLoading: isLoadingBill } = useGetBillById(billId as string);
  const {
    data: expenses,
    isLoading: isLoadingExpenses,
    refetch: refetchExpenses,
  } = useGetExpensesByBill(billId as string);

  const groupId = bill?.groupId || '';
  const { data: members } = useGetGroupMembers(groupId);
  const { mutate: deleteExpense } = useDeleteExpense(groupId, billId as string);
  const { mutate: deleteBill, isPending: isDeletingBill } = useDeleteBill(groupId);

  // Xóa useLayoutEffect cũ vì ta dùng custom header
  
  const handleDeleteExpense = (expenseId: string) => {
    setConfirmModal({
      visible: true,
      title: 'Xóa chi tiêu',
      message: 'Bạn có chắc muốn xóa chi tiêu này không?',
      type: 'danger',
      confirmText: 'Xóa',
      onConfirm: () => {
        deleteExpense(expenseId, {
          onSuccess: () => showToast('success', 'Thành công', 'Đã xóa chi tiêu.'),
          onError: () => showToast('error', 'Lỗi', 'Không thể xóa chi tiêu.')
        });
      }
    });
  };

  const handleDeleteBill = () => {
    setConfirmModal({
      visible: true,
      title: 'Xóa Hóa Đơn',
      message: 'Hành động này sẽ xóa tất cả chi tiêu bên trong. Bạn có chắc chắn không?',
      type: 'danger',
      confirmText: 'Xóa Vĩnh Viễn',
      onConfirm: () => {
        deleteBill(billId as string, {
          onSuccess: () => {
            showToast('success', 'Thành công', 'Hóa đơn đã được xóa.');
            router.back();
          },
          onError: () => showToast('error', 'Lỗi', 'Không thể xóa hóa đơn.')
        });
      }
    });
  };

  const getMemberName = (m: any) => m.userName || m.user?.userName || 'Thành viên';
  const getMemberId = (m: any) => m.userId || m.user?.id;

  const getPayerName = (paidById: string) => {
    const member = members?.find((m) => getMemberId(m) === paidById);
    return member ? getMemberName(member) : 'Thành viên';
  };

  // --- RENDER ---

  if (isLoadingBill || isLoadingExpenses) {
    return <ActivityIndicator size="large" color={APP_COLOR.ORANGE} style={styles.center} />;
  }

  if (!bill) {
    return <View style={styles.center}><Text>Không tìm thấy hóa đơn.</Text></View>;
  }

  // 👇 1. NÚT XÓA (Cập nhật style)
  const renderRightActions = (expenseId: string) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction} // Style mới
        onPress={() => handleDeleteExpense(expenseId)}
      >
        <Ionicons name="trash" size={24} color="white" />
        <Text style={styles.deleteText}>Xóa</Text>
      </TouchableOpacity>
    );
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const payerName = getPayerName(item.paidBy);
    return (
      // 👇 2. WRAPPER (Bọc ngoài để tạo khoảng cách giữa các dòng)
      <View style={styles.rowWrapper}>
        <Swipeable
          renderRightActions={() => renderRightActions(item.id)}
          overshootRight={false}
          containerStyle={styles.swipeContainer} // Style container
        >
          <TouchableOpacity
            style={styles.itemContainer}
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/groups/expense/[expenseId]',
                params: { expenseId: item.id },
              })
            }
          >
            {/* Icon */}
            <View style={styles.iconBox}>
               <Ionicons name="receipt" size={24} color={APP_COLOR.ORANGE} />
            </View>

            {/* Nội dung */}
            <View style={styles.itemContent}>
              <Text style={styles.itemName} numberOfLines={1}>{item.description}</Text>
              <Text style={styles.itemSubText}>{payerName} đã trả</Text>
            </View>

            {/* Số tiền */}
            <View style={styles.itemAmountBox}>
              <Text style={styles.itemAmount}>{item.amount.toLocaleString('vi-VN')} ₫</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>
        </Swipeable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      {/* --- CUSTOM HEADER --- */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết hóa đơn</Text>
        <TouchableOpacity onPress={handleDeleteBill} disabled={isDeletingBill} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerCard}>
          <Text style={styles.headerLabel}>TỔNG HÓA ĐƠN</Text>
          <Text style={styles.headerTotal}>
            {bill.totalAmount.toLocaleString('vi-VN')} <Text style={styles.currency}>₫</Text>
          </Text>
          <View style={styles.headerDivider} />
          <View style={styles.headerRow}>
            <View style={styles.infoItem}>
                <Ionicons name="document-text-outline" size={16} color="#666"/>
                <Text style={styles.headerInfo}>{bill.description}</Text>
            </View>
            <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={16} color="#666"/>
                <Text style={styles.headerInfo}>{new Date(bill.createdTime).toLocaleDateString('vi-VN')}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Danh sách chi tiêu ({expenses?.length || 0})</Text>

        <FlatList
          data={expenses || []}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có chi tiêu nào.</Text>
            </View>
          }
          onRefresh={refetchExpenses}
          refreshing={isLoadingExpenses}
        />
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/groups/create-expense',
            params: { billId: billId, groupId: bill.groupId },
          })
        }
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      <ConfirmModal
        visible={confirmModal.visible}
        onClose={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
      />
    </SafeAreaView>
  );
};

// 👇 3. STYLES MỚI (Đã căn chỉnh đều nhau)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  contentContainer: { flex: 1, paddingHorizontal: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Custom Header
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  backButton: { padding: 5 },
  deleteButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  // Header Card
  headerCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  headerLabel: { fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  headerTotal: { fontSize: 36, fontWeight: '800', color: APP_COLOR.ORANGE, marginVertical: 8 },
  currency: { fontSize: 20, fontWeight: '600', color: '#888' },
  headerDivider: { height: 1, width: '100%', backgroundColor: '#f0f0f0', marginVertical: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerInfo: { fontSize: 14, color: '#444', fontWeight: '500' },
  
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 12, marginLeft: 5, textTransform: 'uppercase' },

  // --- STYLES QUAN TRỌNG ĐỂ CĂN ĐỀU ---
  
  // Wrapper bao ngoài mỗi dòng -> Chịu trách nhiệm khoảng cách giữa các dòng
  rowWrapper: {
    marginBottom: 12, // Khoảng cách giữa các item
  },
  
  // Container của Swipeable -> Bo tròn góc cho cả nút xóa và item trắng
  swipeContainer: {
    borderRadius: 16, 
    overflow: 'hidden', // Để bo tròn cả nút xóa khi kéo ra
  },

  // Nút Xóa (Màu đỏ)
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%', // ✅ Cao bằng item trắng 100%
    // Không set margin/radius ở đây nữa, swipeContainer sẽ lo
  },
  deleteText: { color: 'white', fontWeight: 'bold', fontSize: 12, marginTop: 4 },

  // Ô Chi tiêu (Màu trắng)
  itemContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    // Không set margin/radius ở đây, swipeContainer sẽ lo
    height: 80, // ✅ Đặt chiều cao cố định tối thiểu để đều nhau
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFF5E5', justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  itemContent: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#333' },
  itemSubText: { fontSize: 13, color: '#888', marginTop: 3 },
  itemAmountBox: { alignItems: 'flex-end' },
  itemAmount: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  
  // Empty & FAB
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', marginTop: 10 },
  fab: {
    position: 'absolute', right: 20, bottom: 30,
    backgroundColor: APP_COLOR.ORANGE, width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', elevation: 6,
    shadowColor: APP_COLOR.ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
});

export default BillDetailScreen;