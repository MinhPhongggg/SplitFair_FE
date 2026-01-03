import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useGetGroupMembers, useUserSearch, useAddMember, useGetGroupById, useRemoveMember, useGetGroupBalances } from '@/api/hooks';
import { APP_COLOR } from '@/utils/constant';
import Ionicons from '@expo/vector-icons/Ionicons';
import { User } from '@/types/user.types';
import { useToast } from '@/context/toast.context';
import { useCurrentApp } from '@/context/app.context';
import { GroupMember } from '@/types/group.types';
// Components
import { MemberItem } from '@/component/group/MemberItem';
import { AddMemberModal } from '@/component/group/AddMemberModal';
import ConfirmModal from '@/component/ConfirmModal';

const GroupMembersTab = ({ route }: any) => {
  const { groupId } = route.params;
  const { appState } = useCurrentApp();
  const currentUserId = appState?.userId;

  const { data: members, isLoading, refetch } = useGetGroupMembers(groupId);
  const { data: group } = useGetGroupById(groupId);
  const { data: balances } = useGetGroupBalances(groupId);
  const { mutate: removeMember } = useRemoveMember(groupId);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);

  const [query, setQuery] = useState('');
  const { showToast } = useToast();
  
  const { data: users, isLoading: isSearching } = useUserSearch(query);
  const { mutate: addMember, isPending: isAdding } = useAddMember(groupId as string);

  const isLeader = group?.createdBy === currentUserId;

  const handleAdd = (user: User) => {
    const isExist = members?.some(m => m.userId === user.id || m.user?.id === user.id);
    if (isExist) {
      showToast('warning', 'Đã tồn tại', 'Thành viên này đã có trong nhóm.');
      return;
    }
    addMember({ userId: user.id }, {
      onSuccess: () => {
        showToast('success', 'Thành công', `Đã thêm ${user.name} vào nhóm.`);
        refetch(); setQuery(''); setShowAddMemberModal(false);
      },
      onError: (err: any) => showToast('error', 'Lỗi', err.response?.data?.message || err.message),
    });
  };

  const handleRemoveRequest = (member: GroupMember) => {
      // Check debts
      const memberBalance = balances?.find(b => b.userId === member.userId || b.userId === member.user?.id);
      const amount = parseFloat(memberBalance?.netAmount || "0");
      
      if (Math.abs(amount) > 100) {
          showToast("error", "Không thể xóa", "Thành viên này vẫn còn dư nợ chưa thanh toán.");
          return;
      }
      
      setSelectedMember(member);
      setShowConfirmDelete(true);
  };

  const confirmDeleteMember = () => {
      if (!selectedMember) return;
      
      removeMember({ memberId: selectedMember.id }, {
          onSuccess: () => {
              showToast("success", "Thành công", "Đã xóa thành viên khỏi nhóm.");
              refetch();
              setShowConfirmDelete(false);
              setSelectedMember(null);
          },
          onError: (err) => {
              showToast("error", "Lỗi", err.message || "Không thể xóa thành viên");
          }
      });
  };

  if (isLoading) return <ActivityIndicator size="large" color={APP_COLOR.ORANGE} style={styles.center} />;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Danh sách thành viên ({members?.length || 0})</Text>
      </View>
      
      <FlatList
        data={members || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
            <MemberItem 
                item={item} 
                currentUserId={currentUserId}
                isLeader={isLeader}
                onRemove={handleRemoveRequest}
            />
        )}
        ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>Chưa có thành viên nào.</Text></View>}
        onRefresh={refetch} refreshing={isLoading}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddMemberModal(true)}>
        <Ionicons name="person-add" size={24} color="white" />
      </TouchableOpacity>

      <AddMemberModal
        visible={showAddMemberModal} onClose={() => setShowAddMemberModal(false)}
        query={query} setQuery={setQuery} users={users} isSearching={isSearching}
        onAddMember={handleAdd} isAdding={isAdding} groupId={groupId}
        showToast={(type: any, title: string, msg: string) => showToast(type, title, msg)}
      />

      <ConfirmModal
        visible={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={confirmDeleteMember}
        title="Tùy chọn thành viên"
        message={
            <Text>
                Bạn có muốn xóa <Text style={{fontWeight: 'bold', color: '#111827'}}>{selectedMember?.userName || selectedMember?.user?.userName}</Text> khỏi nhóm?
            </Text>
        }
        subMessage="Hành động này không thể hoàn tác."
        confirmText="XÓA KHỎI NHÓM"
        cancelText="HỦY"
        variant="material"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 15, paddingBottom: 80 },
  headerContainer: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 5 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyText: { color: 'gray', marginTop: 10 },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: APP_COLOR.ORANGE, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6 },
});

export default GroupMembersTab;