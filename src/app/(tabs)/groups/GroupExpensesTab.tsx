// src/app/(tabs)/groups/GroupExpensesTab.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { APP_COLOR } from '@/utils/constant';
import { Expense } from '@/types/expense.types';
import { useGetExpensesByGroup } from '@/api/hooks';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useGetGroupMembers } from '@/api/hooks'; // 👈 Import hook members

const Avatar = ({ name }: { name: string }) => (
  <View
    style={{
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: APP_COLOR.ORANGE,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    }}
  >
    <Text style={{ color: 'white', fontWeight: 'bold' }}>
      {name.charAt(0).toUpperCase()}
    </Text>
  </View>
);

const GroupExpensesTab = ({ route }: any) => {
  const { groupId } = route.params;
  const { data: expenses, isLoading: isLoadingExpenses, refetch } = useGetExpensesByGroup(groupId);
  
  // 👇 SỬA DÒNG 2: Lấy cả isLoadingMembers
  const { data: members, isLoading: isLoadingMembers } = useGetGroupMembers(groupId);

  const getMemberName = (m: any) => m.userName || m.user?.userName || 'Thành viên';
  const getMemberId = (m: any) => m.userId || m.user?.id;

  const getPayerName = (paidByUuid: string) => {
    const member = members?.find((m) => getMemberId(m) === paidByUuid);
    return member ? getMemberName(member) : 'Không rõ';
  };

  if (isLoadingExpenses || isLoadingMembers) {
    return (
      <ActivityIndicator
        size="large"
        color={APP_COLOR.ORANGE}
        style={styles.center}
      />
    );
  }

  const renderItem = ({ item }: { item: Expense }) => {
    const payerName = getPayerName(item.paidBy);
    const shareType = 'SHARE'; 
    
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => 
          router.push({
          pathname: '/(tabs)/groups/expense/[expenseId]',
          params: { expenseId: item.id }
        })
        }
      >
        <Avatar name={payerName} />
        <View style={styles.itemContent}>
          <Text style={styles.itemName}>{item.description}</Text>
          <Text style={styles.itemMeta}>
            {payerName} đã trả • {shareType}
          </Text>
        </View>
        <View style={styles.itemAmountContainer}>
          <Text style={styles.itemAmount}>
            {item.amount.toLocaleString('vi-VN')} VND
          </Text>
          <Ionicons name="chevron-forward" size={20} color="gray" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={expenses || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>Chưa có chi tiêu nào.</Text>
          </View>
        }
        onRefresh={refetch}
        refreshing={isLoadingExpenses}
        contentContainerStyle={{ padding: 10 }}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          router.push({
            // Sửa lại: Phải trỏ đến 'create-expense'
            pathname: '/(tabs)/groups/create-expense', 
            params: { groupId: groupId },
          })
        }
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// Styles (Tương tự GroupBillsTab)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  itemContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemMeta: {
    fontSize: 14,
    color: 'gray',
  },
  itemAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
    color: '#333',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF', // Màu xanh dương
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  fabText: {
    fontSize: 30,
    color: 'white',
  },
});

export default GroupExpensesTab;