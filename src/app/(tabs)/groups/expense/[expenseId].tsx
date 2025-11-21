// src/app/(tabs)/groups/expense/[expenseId].tsx
import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert, // 👈 Import Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import {
  useGetExpenseById,
  useGetSharesByExpense,
  useGetGroupMembers,
  useDeleteExpense, // 👈 Import
} from '@/api/hooks';
import { APP_COLOR } from '@/utils/constant';
import { ExpenseShare } from '@/types/expense.types';
import Avatar from '@/component/Avatar';
import Ionicons from '@expo/vector-icons/Ionicons';

const ExpenseDetailScreen = () => {
  const { expenseId } = useLocalSearchParams<{ expenseId: string }>();
  const navigation = useNavigation();
  const router = useRouter();

  const { data: expense, isLoading: isLoadingExpense } = useGetExpenseById(
    expenseId as string
  );
  const { data: shares, isLoading: isLoadingShares } = useGetSharesByExpense(
    expenseId as string
  );
  const { data: members, isLoading: isLoadingMembers } = useGetGroupMembers(
    expense?.groupId || ''
  );

  // Hook xóa expense
  const { mutate: deleteExpense, isPending: isDeleting } = useDeleteExpense(
    expense?.groupId || '',
    expense?.billId || ''
  );

  const handleDelete = () => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa khoản chi tiêu này không? Hành động này sẽ hoàn tác các thay đổi về số dư nợ.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            deleteExpense(expenseId as string, {
              onSuccess: () => {
                router.back();
              },
              onError: () => {
                Alert.alert("Lỗi", "Không thể xóa chi tiêu.");
              }
            });
          },
        },
      ]
    );
  };

  if (isLoadingExpense || isLoadingShares || isLoadingMembers) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={APP_COLOR.ORANGE} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tìm thấy chi tiêu.</Text>
      </View>
    );
  }

  const getUserName = (userId: string) => {
    const member = members?.find((m) => m.userId === userId || m.user?.id === userId);
    return member?.userName || member?.user?.userName || 'Thành viên';
  };

  const payerName = getUserName(expense.paidBy);
  const totalAmount = expense.amount;
  const dateStr = new Date(expense.createdTime).toLocaleDateString('vi-VN');

  const renderShareItem = ({ item }: { item: ExpenseShare }) => {
    const shareAmount = item.shareAmount ?? (totalAmount * (item.percentage / 100));
    const userName = getUserName(item.userId);
    const isPayer = item.userId === expense.paidBy;

    return (
      <View style={styles.itemContainer}>
        <Avatar name={userName} />
        
        <View style={styles.itemContent}>
          <Text style={styles.itemName}>{userName}</Text>
          <Text style={styles.itemRole}>
            {isPayer ? 'Người trả tiền' : 'Người thụ hưởng'}
          </Text>
        </View>

        <View style={styles.itemRight}>
          <Text style={[styles.itemAmount, isPayer ? styles.paidAmount : styles.oweAmount]}>
            {shareAmount ? shareAmount.toLocaleString('vi-VN') : '0'} ₫
          </Text>
          <Ionicons 
            name={item.status === 'PAID' ? "checkmark-circle" : "time-outline"} 
            size={16} 
            color={item.status === 'PAID' ? "#34C759" : "gray"} 
            style={{marginTop: 4}}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

      {/* --- Custom Header --- */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết chi tiêu</Text>
        <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity 
            onPress={handleDelete}
            style={[styles.editButton, { marginRight: 10 }]}
            disabled={isDeleting}
            >
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
            <TouchableOpacity 
            onPress={() =>
                router.push({
                pathname: '/(tabs)/groups/expense/edit/[expenseId]',
                params: { expenseId: expense.id, groupId: expense.groupId },
                })
            }
            style={styles.editButton}
            >
            <Text style={styles.editButtonText}>Sửa</Text>
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* --- Header Card --- */}
        <View style={styles.headerCard}>
          <View style={styles.iconBox}>
              <Ionicons name="fast-food-outline" size={32} color={APP_COLOR.ORANGE} />
          </View>
          <Text style={styles.description}>{expense.description}</Text>
          <Text style={styles.totalAmount}>
            {totalAmount.toLocaleString('vi-VN')} <Text style={styles.currency}>₫</Text>
          </Text>
          
          <View style={styles.divider} />
          
          <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Người trả</Text>
                  <Text style={styles.metaValue}>{payerName}</Text>
              </View>
              <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Ngày tạo</Text>
                  <Text style={styles.metaValue}>{dateStr}</Text>
              </View>
          </View>
        </View>

        {/* --- List --- */}
        <Text style={styles.sectionTitle}>Danh sách chia tiền</Text>
        
        <FlatList
          data={shares || []}
          renderItem={renderShareItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  contentContainer: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'gray', fontSize: 16 },

  // Custom Header
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 5,
  },
  backButton: { padding: 5 },
  editButton: { padding: 5 },
  editButtonText: { color: APP_COLOR.ORANGE, fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  // Header Card Styles
  headerCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
    elevation: 5,
  },
  iconBox: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#FFF5E5', // Cam nhạt
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  description: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 5, textAlign: 'center' },
  totalAmount: { fontSize: 36, fontWeight: '800', color: APP_COLOR.ORANGE },
  currency: { fontSize: 20, fontWeight: '600', color: '#888' },
  
  divider: { width: '100%', height: 1, backgroundColor: '#F0F0F0', marginVertical: 15 },
  
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  metaItem: { alignItems: 'center', flex: 1 },
  metaLabel: { fontSize: 12, color: '#888', marginBottom: 2, textTransform: 'uppercase' },
  metaValue: { fontSize: 15, fontWeight: '600', color: '#333' },

  // Section Title
  sectionTitle: {
    fontSize: 16, fontWeight: 'bold', color: '#666',
    marginLeft: 20, marginBottom: 10, marginTop: 5, textTransform: 'uppercase'
  },

  // List Styles
  listContent: { paddingHorizontal: 15, paddingBottom: 30 },
  itemContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
    elevation: 2,
  },
  itemContent: { flex: 1, marginLeft: 0 }, // Avatar đã có margin trong component
  itemName: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemRole: { fontSize: 12, color: '#888', marginTop: 2 },
  
  itemRight: { alignItems: 'flex-end' },
  itemAmount: { fontSize: 16, fontWeight: 'bold' },
  
  // Colors for amounts
  paidAmount: { color: '#34C759' }, // Xanh lá (Đã trả/Người trả)
  oweAmount: { color: '#FF3B30' },  // Đỏ (Nợ/Phần phải đóng)
});

export default ExpenseDetailScreen;