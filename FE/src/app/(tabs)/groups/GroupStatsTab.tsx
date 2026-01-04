// src/app/(tabs)/groups/GroupStatsTab.tsx
import React, { useState, useMemo } from 'react';
import {
  View, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Text
} from 'react-native';
import { router } from 'expo-router';
import { APP_COLOR } from '@/utils/constant';
import {
  useGetGroupPaymentStats, useGetGroupBalances, useGetExpensesByGroup,
  useGetGroupMembers, useCreateExpense, useSaveExpenseShares,
  useGetBillsByGroup, useCreateBill, useGetCategories
} from '@/api/hooks';
import { sendDebtReminder } from '@/api/notifications';
import Ionicons from '@expo/vector-icons/Ionicons';
import SkiaPieChart from '@/component/SkiaPieChart';
import { useCurrentApp } from '@/context/app.context';
import { useToast } from '@/context/toast.context';
import { ExpenseShareSaveRequest } from '@/types/expense.types';
import ConfirmModal from '@/component/ConfirmModal';

// Import Components
import { PersonalStatsCard } from '@/component/group/PersonalStatsCard';
import { BalanceItem } from '@/component/group/BalanceItem';
import { DebtSuggestionItem } from '@/component/group/DebtSuggestionItem';
import { ExpenseItem } from '@/component/group/ExpenseItem';
import { StatsFilterModal } from '@/component/group/StatsFilterModal';
import { ActionModal } from '@/component/group/ActionModal';
import Avatar from '@/component/Avatar';

const PIE_COLORS = ['#007AFF', '#FFCC00', '#34C759', '#FF3B30', '#8E8E93'];
type SortOption = 'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC';

const GroupStatsTab = ({ route }: any) => {
  const { groupId } = route.params;
  const { appState } = useCurrentApp();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'BALANCES' | 'TRANSACTIONS'>('BALANCES');

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterPayer, setFilterPayer] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('DATE_DESC');
  const [confirmModal, setConfirmModal] = useState({ visible: false, title: '', message: '', onConfirm: () => {}, type: 'info' as any });
  const [actionModal, setActionModal] = useState({ visible: false, item: null as any });


  // API
  const { data: stats, isLoading: l1 } = useGetGroupPaymentStats(groupId);
  const { data: balances, isLoading: l2 } = useGetGroupBalances(groupId);
  const { data: expenses, isLoading: l3 } = useGetExpensesByGroup(groupId);
  const { data: members, isLoading: l4 } = useGetGroupMembers(groupId);
  const { data: bills } = useGetBillsByGroup(groupId);
  const { data: categories } = useGetCategories();
  
  const { mutateAsync: createBill } = useCreateBill(groupId);
  const { mutateAsync: createExpense } = useCreateExpense('');
  const { mutateAsync: saveShares } = useSaveExpenseShares(groupId);

  // Handlers
  const handleRemind = async (item: any) => {
    try {
      await sendDebtReminder(
        String(appState?.userId || ''),
        item.fromId,
        item.amount,
        groupId
      );
      showToast('success', 'Đã gửi nhắc nợ', `Đã nhắc ${item.from} trả tiền.`);
      setActionModal({ visible: false, item: null });
    } catch (error) {
      showToast('error', 'Lỗi', 'Không thể gửi nhắc nợ.');
    }
  };

  const handleSettlement = async (item: any) => {
    try {
      const categoryId = categories?.[0]?.id;
      // Nếu không có category, vẫn cho phép tạo nhưng cảnh báo hoặc dùng default nếu backend cho phép
      // Ở đây ta cứ lấy cái đầu tiên, nếu không có thì để chuỗi rỗng (backend có thể validate)
      
      // 1. Tạo Bill "Thanh toán nợ"
      const newBill = await createBill({
        groupId,
        description: "Thanh toán nợ",
        totalAmount: item.amount,
        createdBy: String(appState?.userId || ''),
        categoryId: categoryId || '',
        status: 'COMPLETED',
        isPayment: true // ✅ Đánh dấu là thanh toán
      });

      // 2. Tạo Expense
      const newExpense = await createExpense({
        billId: newBill.id,
        groupId,
        description: `Thanh toán nợ từ ${item.from} đến ${item.to}`,
        amount: item.amount,
        paidBy: item.fromId,
        createdBy: String(appState?.userId || ''),
        userId: item.fromId,
        status: 'COMPLETED'
      });

      // 3. Tạo Share
      const shareRequest: ExpenseShareSaveRequest = {
        expenseId: newExpense.id,
        totalAmount: item.amount,
        paidBy: item.fromId,
        currency: 'VND',
        shares: [{
          userId: item.toId,
          shareAmount: item.amount,
          percentage: 100
        }]
      };
      
      await saveShares(shareRequest);
      
      showToast('success', 'Thành công', 'Đã ghi nhận thanh toán.');
      setActionModal({ visible: false, item: null });
    } catch (error) {
      console.error(error);
      showToast('error', 'Lỗi', 'Không thể ghi nhận thanh toán.');
    }
  };
  
  // Helper
  const getPayerName = (id: string) => {
    const m = members?.find(m => (m.userId || m.user?.id) === id);
    return m?.userName || m?.user?.userName || 'Ai đó';
  };
  const getAvatar = (id: string) => members?.find(m => (m.userId || m.user?.id) === id)?.user?.avatar;

  // --- LOGIC TÍNH TOÁN (Đã sửa thứ tự) ---
  
  // 1. Xác định các khoản chi tiêu thực (loại bỏ thanh toán nợ)
  const settlementBillIds = useMemo(() => bills?.filter(b => b.isPayment || b.description?.startsWith("Thanh toán") || b.description?.startsWith("Trả nợ")).map(b => b.id) || [], [bills]);
  const realExpenses = useMemo(() => expenses?.filter(e => {
    if (settlementBillIds.includes(e.billId)) return false;
    // Fallback: Kiểm tra description của expense
    const desc = e.description?.toLowerCase() || "";
    if (desc.startsWith("trả nợ") || desc.startsWith("thanh toán")) return false;
    return true;
  }) || [], [expenses, settlementBillIds]);

  // 2. Lọc & Sắp xếp trên danh sách `realExpenses`
  const filteredExpenses = useMemo(() => {
    if (!realExpenses) return [];
    let res = [...realExpenses];

    // Tìm kiếm
    if (searchQuery) res = res.filter(e => e.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Lọc người trả (Sửa logic so sánh ID)
    if (filterPayer) res = res.filter(e => e.paidBy === filterPayer);

    // Sắp xếp
    res.sort((a, b) => {
      if (sortOption === 'DATE_DESC') return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime();
      if (sortOption === 'DATE_ASC') return new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime();
      if (sortOption === 'AMOUNT_DESC') return b.amount - a.amount;
      return 0;
    });
    return res;
  }, [realExpenses, searchQuery, filterPayer, sortOption]);

  const handleResetFilter = () => { setFilterPayer(null); setSortOption('DATE_DESC'); setShowFilterModal(false); };

  // 3. Tính toán thống kê
  const calculatedStats = useMemo(() => {
      if (!realExpenses || !members) return [];
      const map: Record<string, number> = {};
      realExpenses.forEach(e => { map[e.paidBy] = (map[e.paidBy] || 0) + e.amount; });
      return Object.keys(map).map(userId => {
          const member = members.find((m: any) => (m.userId || m.user?.id) === userId);
          return { userName: member ? (member.userName || member.user?.userName || 'Thành viên') : 'Ai đó', totalAmount: map[userId] };
      });
  }, [realExpenses, members]);

  const totalSpent = calculatedStats.reduce((sum, s) => sum + s.totalAmount, 0);
  const pieData = calculatedStats.map((s, i) => ({ key: s.userName, value: s.totalAmount, color: PIE_COLORS[i % PIE_COLORS.length] })).filter(d => d.value > 0);

  const debtSuggestions = useMemo(() => {
    // ... (Giữ nguyên logic gợi ý nợ) ...
    if (!balances) return [];
    let debtors = balances.filter(b => parseFloat(b.netAmount) < -1).map(b => ({ ...b, amount: Math.abs(parseFloat(b.netAmount)) })).sort((a, b) => b.amount - a.amount);
    let creditors = balances.filter(b => parseFloat(b.netAmount) > 1).map(b => ({ ...b, amount: parseFloat(b.netAmount) })).sort((a, b) => b.amount - a.amount);
    const suggestions = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i], creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);
      if (amount > 0) suggestions.push({ from: debtor.userName, fromId: debtor.userId, to: creditor.userName, toId: creditor.userId, amount });
      debtor.amount -= amount; creditor.amount -= amount;
      if (debtor.amount < 1) i++; if (creditor.amount < 1) j++;
    }
    return suggestions;
  }, [balances]);

  const myBalanceObj = balances?.find(b => b.userId === appState?.userId);
  const myNetBalance = myBalanceObj ? parseFloat(myBalanceObj.netAmount) : 0;
  const myTotalPaid = realExpenses ? realExpenses.filter(e => e.paidBy === appState?.userId).reduce((sum, e) => sum + e.amount, 0) : 0;
  const myActualCost = myTotalPaid - myNetBalance;

  if (l1 || l2 || l3 || l4) return <ActivityIndicator size="large" color={APP_COLOR.ORANGE} style={styles.center} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
      <View style={styles.container}>
        <View style={styles.tabHeader}>
            <TouchableOpacity style={[styles.tabButton, activeTab === 'BALANCES' && styles.tabActive]} onPress={() => setActiveTab('BALANCES')}><Text style={[styles.tabText, activeTab === 'BALANCES' && styles.tabTextActive]}>Nợ dư</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.tabButton, activeTab === 'TRANSACTIONS' && styles.tabActive]} onPress={() => setActiveTab('TRANSACTIONS')}><Text style={[styles.tabText, activeTab === 'TRANSACTIONS' && styles.tabTextActive]}>Giao dịch</Text></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {activeTab === 'BALANCES' ? (
            <>
               <PersonalStatsCard netBalance={myNetBalance} totalPaid={myTotalPaid} actualCost={myActualCost} />
               
               {/* Phần Gợi ý thanh toán tối ưu - Chỉ hiển thị khi có nợ */}
               {debtSuggestions.length > 0 && (
                 <View style={styles.card}>
                   <View style={styles.cardHeaderRow}>
                     <Ionicons name="flash" size={20} color={APP_COLOR.ORANGE} />
                     <Text style={[styles.cardHeader, { marginLeft: 8, marginBottom: 0 }]}>Thanh toán nhanh</Text>
                   </View>
                   <Text style={styles.cardSubtitle}>
                     {debtSuggestions.length} giao dịch để sòng phẳng
                   </Text>
                   {debtSuggestions.map((item, i) => (
                      <DebtSuggestionItem 
                        key={i} 
                        item={item} 
                        getAvatar={getAvatar} 
                        currentUserId={String(appState?.userId)}
                        onPress={() => setActionModal({ visible: true, item })}
                        onPay={() => {
                          setConfirmModal({
                            visible: true,
                            title: "Xác nhận thanh toán",
                            message: `Bạn có chắc chắn muốn ghi nhận đã trả ${item.amount.toLocaleString('vi-VN')}đ cho ${item.to}?`,
                            type: "info",
                            onConfirm: () => handleSettlement(item)
                          });
                        }}
                        onRemind={() => {
                          setConfirmModal({
                            visible: true,
                            title: "Gửi nhắc nợ",
                            message: `Gửi thông báo nhắc ${item.from} trả ${item.amount.toLocaleString('vi-VN')}đ?`,
                            type: "info",
                            onConfirm: () => handleRemind(item)
                          });
                        }}
                      />
                   ))}
                 </View>
               )}

               {/* Tổng quan số dư - Hiển thị dạng visual */}
               <View style={styles.card}>
                 <View style={styles.cardHeaderRow}>
                   <Ionicons name="wallet" size={20} color="#007AFF" />
                   <Text style={[styles.cardHeader, { marginLeft: 8, marginBottom: 0 }]}>Số dư thành viên</Text>
                 </View>
                 
                 {balances?.filter(b => parseFloat(b.netAmount) !== 0).length ? (
                   <View style={styles.balanceVisual}>
                     {/* Người được nhận (số dư dương) */}
                     {balances.filter(b => parseFloat(b.netAmount) > 0).length > 0 && (
                       <View style={styles.balanceSection}>
                         <Text style={styles.balanceSectionTitle}>💰 Được nhận lại</Text>
                         {balances.filter(b => parseFloat(b.netAmount) > 0)
                           .sort((a, b) => parseFloat(b.netAmount) - parseFloat(a.netAmount))
                           .map(b => (
                             <TouchableOpacity 
                               key={b.userId} 
                               style={styles.balanceRow}
                               onPress={() => router.push({ pathname: '/(tabs)/groups/member/[userId]', params: { userId: b.userId, userName: b.userName, groupId } })}
                             >
                               <View style={styles.balanceUser}>
                                 <Avatar name={b.userName} avatar={getAvatar(b.userId)} size={36} />
                                 <Text style={styles.balanceName}>{b.userName}</Text>
                               </View>
                               <Text style={[styles.balanceAmount, { color: '#4CAF50' }]}>
                                 +{parseFloat(b.netAmount).toLocaleString('vi-VN')}đ
                               </Text>
                             </TouchableOpacity>
                           ))
                         }
                       </View>
                     )}
                     
                     {/* Người phải trả (số dư âm) */}
                     {balances.filter(b => parseFloat(b.netAmount) < 0).length > 0 && (
                       <View style={[styles.balanceSection, { marginTop: 15 }]}>
                         <Text style={styles.balanceSectionTitle}>💸 Cần trả thêm</Text>
                         {balances.filter(b => parseFloat(b.netAmount) < 0)
                           .sort((a, b) => parseFloat(a.netAmount) - parseFloat(b.netAmount))
                           .map(b => (
                             <TouchableOpacity 
                               key={b.userId} 
                               style={styles.balanceRow}
                               onPress={() => router.push({ pathname: '/(tabs)/groups/member/[userId]', params: { userId: b.userId, userName: b.userName, groupId } })}
                             >
                               <View style={styles.balanceUser}>
                                 <Avatar name={b.userName} avatar={getAvatar(b.userId)} size={36} />
                                 <Text style={styles.balanceName}>{b.userName}</Text>
                               </View>
                               <Text style={[styles.balanceAmount, { color: '#F44336' }]}>
                                 {parseFloat(b.netAmount).toLocaleString('vi-VN')}đ
                               </Text>
                             </TouchableOpacity>
                           ))
                         }
                       </View>
                     )}
                   </View>
                 ) : (
                   <View style={styles.allSettledContainer}>
                     <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                     <Text style={styles.allSettledText}>🎉 Tất cả đã sòng phẳng!</Text>
                   </View>
                 )}
               </View>
            </>
          ) : (
             <View>
                {totalSpent > 0 && (
                  <View style={styles.card}>
                    <Text style={styles.chartTitle}>Tổng chi: <Text style={{color: APP_COLOR.ORANGE}}>{totalSpent.toLocaleString('vi-VN')}đ</Text></Text>
                    <View style={styles.chartContainer}><SkiaPieChart data={pieData} size={140} totalValue={totalSpent} /></View>
                    <View style={styles.legendContainer}>{calculatedStats.map((s, i) => <View style={styles.legendItem} key={s.userName}><View style={[styles.legendColor, { backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }]} /><Text style={styles.legendName}>{s.userName}</Text><Text style={styles.legendPercent}>{totalSpent > 0 ? ((s.totalAmount / totalSpent) * 100).toFixed(0) : 0}%</Text></View>)}</View>
                  </View>
                )}
                <View style={styles.listHeader}>
                  <Text style={styles.sectionTitle}>Lịch sử</Text>
                  <View style={styles.searchRow}>
                    <View style={styles.searchBox}><Ionicons name="search" size={20} color="gray"/><TextInput placeholder="Tìm kiếm..." value={searchQuery} onChangeText={setSearchQuery} style={styles.searchInput} />{searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={16} color="gray" /></TouchableOpacity>}</View>
                    <TouchableOpacity style={[styles.filterButton, (!!filterPayer || sortOption !== 'DATE_DESC') && styles.filterActive]} onPress={() => setShowFilterModal(true)}><Ionicons name="options" size={24} color={(filterPayer || sortOption !== 'DATE_DESC') ? APP_COLOR.ORANGE : "#555"} /></TouchableOpacity>
                  </View>
                </View>
                {filteredExpenses.map(item => (
                   <ExpenseItem 
                      key={item.id} 
                      item={item}
                      payerName={getPayerName(item.paidBy)} 
                      onPress={(id) => router.push({ pathname: '/(tabs)/groups/expense/[expenseId]', params: { expenseId: id } })} 
                   />
                ))}
                {filteredExpenses.length === 0 && <Text style={styles.emptyText}>Không tìm thấy chi tiêu nào.</Text>}

             </View>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={() => router.push({ pathname: '/(tabs)/groups/create-expense', params: { groupId } })}><Ionicons name="add" size={30} color="white" /></TouchableOpacity>

        <StatsFilterModal visible={showFilterModal} onClose={() => setShowFilterModal(false)} sortOption={sortOption} setSortOption={setSortOption} filterPayer={filterPayer} setFilterPayer={setFilterPayer} members={members} onReset={handleResetFilter} />
        
        <ActionModal
            visible={actionModal.visible}
            onClose={() => setActionModal({ visible: false, item: null })}
            item={actionModal.item}
            currentUserId={String(appState?.userId)}
            onPay={() => handleSettlement(actionModal.item)}
            onRemind={() => handleRemind(actionModal.item)}
        />

        <ConfirmModal
            visible={confirmModal.visible}
            onClose={() => setConfirmModal({ ...confirmModal, visible: false })}
            onConfirm={confirmModal.onConfirm}
            title={confirmModal.title}
            message={confirmModal.message}
            type={confirmModal.type}
            variant="material"
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 15, paddingBottom: 90 },
  tabHeader: { flexDirection: 'row', backgroundColor: 'white', padding: 10, marginHorizontal: 15, marginTop: 15, borderRadius: 12, elevation: 2 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: APP_COLOR.ORANGE },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: 'white' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 15, marginBottom: 15, elevation: 2 },
  cardHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  emptyText: { color: '#888', marginTop: 5, textAlign: 'center' },
  chartTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  chartContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  legendContainer: { flex: 1, marginLeft: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' },
  legendColor: { width: 12, height: 12, borderRadius: 3, marginRight: 8 },
  legendName: { fontSize: 13, color: '#333', flex: 1 },
  legendPercent: { fontSize: 13, fontWeight: 'bold', color: '#666' },
  listHeader: { marginBottom: 10, marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#eee' },
  searchInput: { flex: 1, height: '100%', fontSize: 15, marginLeft: 5 },
  filterButton: { width: 44, height: 44, borderRadius: 10, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  filterActive: { borderColor: APP_COLOR.ORANGE, backgroundColor: '#FFF5E5' },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: APP_COLOR.ORANGE, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  
  // New styles for improved balance display
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  cardSubtitle: { fontSize: 13, color: '#888', marginBottom: 12, marginLeft: 28 },
  balanceVisual: { marginTop: 10 },
  balanceSection: {},
  balanceSectionTitle: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 10 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  balanceUser: { flexDirection: 'row', alignItems: 'center' },
  balanceName: { fontSize: 15, color: '#333', fontWeight: '500', marginLeft: 10 },
  balanceAmount: { fontSize: 15, fontWeight: 'bold' },
  allSettledContainer: { alignItems: 'center', paddingVertical: 30 },
  allSettledText: { fontSize: 16, color: '#4CAF50', fontWeight: '600', marginTop: 10 },
});

export default GroupStatsTab;