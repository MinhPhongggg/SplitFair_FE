import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { APP_COLOR } from '@/utils/constant';
import Avatar from '@/component/Avatar';
import { GroupMember } from '@/types/group.types';

interface Props {
  item: GroupMember;
  currentUserId?: string;
  isLeader?: boolean;
  onRemove?: (member: GroupMember) => void;
}

export const MemberItem = ({ item, currentUserId, isLeader, onRemove }: Props) => {
  // Logic xử lý hiển thị tên/avatar/role y hệt file gốc
  const name = item.userName || item.user?.userName || 'Thành viên';
  const avatar = item.user?.avatar; 
  const role = item.roleName || item.role?.name || 'MEMBER';
  const isItemLeader = role === 'LEADER';
  const isMe = item.userId === currentUserId || item.user?.id === currentUserId;

  const handlePressMore = () => {
    if (isLeader && !isItemLeader && !isMe) {
        // Gọi callback để parent xử lý (hiện modal)
        onRemove && onRemove(item);
    }
  };

  return (
    <View style={styles.memberCard}>
      <Avatar name={name} avatar={avatar} />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{name}</Text>
        <View style={[styles.roleBadge, isItemLeader ? styles.roleLeader : styles.roleMember]}>
          <Text style={[styles.roleText, isItemLeader ? styles.roleTextLeader : styles.roleTextMember]}>
            {isItemLeader ? 'Trưởng nhóm' : 'Thành viên'}
          </Text>
        </View>
      </View>
      {(isLeader && !isItemLeader && !isMe) && (
        <TouchableOpacity style={styles.moreBtn} onPress={handlePressMore}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#ccc" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Copy y nguyên styles từ file gốc
const styles = StyleSheet.create({
  memberCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    padding: 15, borderRadius: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
    elevation: 2,
  },
  memberInfo: { flex: 1, marginLeft: 0 }, 
  memberName: { fontSize: 16, fontWeight: '600', color: '#333' },
  moreBtn: { padding: 5 },
  roleBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4,
  },
  roleLeader: { backgroundColor: '#FFF5E5' }, 
  roleMember: { backgroundColor: '#F9F9F9' }, 
  roleText: { fontSize: 11, fontWeight: '600' },
  roleTextLeader: { color: APP_COLOR.ORANGE },
  roleTextMember: { color: '#888' },
});