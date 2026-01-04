// src/app/(tabs)/groups/GroupBillsTab.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { router } from 'expo-router';
import { APP_COLOR } from '@/utils/constant';
import { Bill } from '@/types/bill.types';
import { useGetBillsByGroup, useGetGroupMembers } from '@/api/hooks';
import Ionicons from '@expo/vector-icons/Ionicons';
import Avatar from '@/component/Avatar';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GroupedPayment {
  type: 'grouped';
  pairKey: string;
  fromName: string;
  toName: string;
  totalAmount: number;
  items: Bill[];
}

interface SingleBill {
  type: 'single';
  bill: Bill;
}

type DisplayItem = GroupedPayment | SingleBill;

const GroupBillsTab = ({ route }: any) => {
  const { groupId } = route.params;
  const { data: bills, isLoading, refetch } = useGetBillsByGroup(groupId);
  const { data: members } = useGetGroupMembers(groupId);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Helper lấy avatar theo tên
  const getAvatarByName = (name: string) => {
    const member = members?.find(m => 
      (m.userName || m.user?.userName) === name
    );
    return member?.user?.avatar;
  };

  // Gom nhóm các hóa đơn thanh toán nợ theo cặp người (A → B)
  const displayItems = useMemo(() => {
    if (!bills) return [];
    
    const result: DisplayItem[] = [];
    const paymentGroups = new Map<string, GroupedPayment>();
    
    // Sắp xếp mới nhất trước
    const sortedBills = [...bills].sort(
      (a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
    );

    sortedBills.forEach(bill => {
      const isPayment = bill.isPayment || bill.description?.startsWith("Thanh toán nợ");
      
      if (isPayment) {
        // Parse description: "Thanh toán nợ" hoặc "X thanh toán nợ cho Y"
        const match = bill.description?.match(/^(.+?) thanh toán nợ cho (.+)$/);
        if (match) {
          const [, fromName, toName] = match;
          const pairKey = `${fromName.trim()}->${toName.trim()}`;
          
          if (paymentGroups.has(pairKey)) {
            const group = paymentGroups.get(pairKey)!;
            group.totalAmount += bill.totalAmount;
            group.items.push(bill);
          } else {
            paymentGroups.set(pairKey, {
              type: 'grouped',
              pairKey,
              fromName: fromName.trim(),
              toName: toName.trim(),
              totalAmount: bill.totalAmount,
              items: [bill],
            });
          }
        } else {
          // Nếu không parse được thì hiển thị riêng
          result.push({ type: 'single', bill });
        }
      } else {
        // Bill thường - hiển thị riêng
        result.push({ type: 'single', bill });
      }
    });

    // Chèn các grouped payments vào đầu danh sách
    const groupedPayments = Array.from(paymentGroups.values());
    return [...groupedPayments, ...result];
  }, [bills]);

  const toggleExpand = (pairKey: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedGroups(prev =>
      prev.includes(pairKey)
        ? prev.filter(k => k !== pairKey)
        : [...prev, pairKey]
    );
  };

  if (isLoading) {
    return (
      <ActivityIndicator
        size="large"
        color={APP_COLOR.ORANGE}
        style={styles.center}
      />
    );
  }

  const renderGroupedPayment = (item: GroupedPayment) => {
    const isExpanded = expandedGroups.includes(item.pairKey);
    
    return (
      <View style={styles.groupedContainer}>
        <TouchableOpacity
          style={styles.groupedHeader}
          onPress={() => toggleExpand(item.pairKey)}
          activeOpacity={0.7}
        >
          <View style={styles.groupedIcon}>
            <View style={styles.avatarStack}>
              <View style={{ zIndex: 2 }}>
                <Avatar name={item.fromName} avatar={getAvatarByName(item.fromName)} size={32} />
              </View>
              <View style={{ marginLeft: -12, zIndex: 1 }}>
                <Avatar name={item.toName} avatar={getAvatarByName(item.toName)} size={32} />
              </View>
            </View>
          </View>
          <View style={styles.itemContent}>
            <Text style={styles.groupedTitle}>
              {item.fromName} <Text style={{color: '#888'}}>→</Text> {item.toName}
            </Text>
            <Text style={styles.groupedSubtitle}>
              {item.items.length} lần thanh toán
            </Text>
          </View>
          <View style={styles.itemAmountContainer}>
            <Text style={[styles.itemAmount, { color: '#4CAF50' }]}>
              {item.totalAmount.toLocaleString('vi-VN')} ₫
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#888"
            />
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandedList}>
            {item.items.map((bill, index) => (
              <TouchableOpacity
                key={bill.id}
                style={[
                  styles.expandedItem,
                  index === item.items.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={() => router.push(`/(tabs)/groups/bill/${bill.id}`)}
              >
                <Text style={styles.expandedAmount}>
                  {bill.totalAmount.toLocaleString('vi-VN')} ₫
                </Text>
                <Text style={styles.expandedDate}>
                  {new Date(bill.createdTime).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderSingleBill = (bill: Bill) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => router.push(`/(tabs)/groups/bill/${bill.id}`)}
    >
      <View style={styles.itemIcon}>
        <Ionicons name="receipt-outline" size={24} color="#007AFF" />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{bill.description}</Text>
        <Text style={styles.itemDate}>
          {new Date(bill.createdTime).toLocaleDateString('vi-VN')}
        </Text>
      </View>
      <View style={styles.itemAmountContainer}>
        <Text style={styles.itemAmount}>
          {bill.totalAmount.toLocaleString('vi-VN')} ₫
        </Text>
        <Ionicons name="chevron-forward" size={20} color="gray" />
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: DisplayItem }) => {
    if (item.type === 'grouped') {
      return renderGroupedPayment(item);
    } else {
      return renderSingleBill(item.bill);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={displayItems}
        keyExtractor={(item, index) => 
          item.type === 'grouped' ? item.pairKey : item.bill.id
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>Chưa có hóa đơn nào.</Text>
          </View>
        }
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ padding: 10 }}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/groups/create-bill',
            params: { groupId: groupId },
          })
        }
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

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
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0EFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDate: {
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
  // Grouped Payment Styles
  groupedContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  groupedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8FFF8',
  },
  groupedIcon: {
    marginRight: 15,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  miniAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  groupedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  groupedSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  expandedList: {
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  expandedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  expandedAmount: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  expandedDate: {
    fontSize: 13,
    color: '#888',
    marginRight: 8,
  },
});

export default GroupBillsTab;