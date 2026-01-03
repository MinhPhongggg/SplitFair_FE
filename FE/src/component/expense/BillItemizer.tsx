import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { BillItem } from '@/types/bill.types';
import { APP_COLOR } from '@/utils/constant';
import Ionicons from '@expo/vector-icons/Ionicons';
import Avatar from '@/component/Avatar';

interface Props {
  items: BillItem[];
  members: any[]; // Danh sách thành viên trong nhóm
  onUpdateItems: (items: BillItem[]) => void;
  getMemberName: (id: string) => string;
  getMemberAvatar: (id: string) => string | undefined;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BillItemizer = ({ items, members, onUpdateItems, getMemberName, getMemberAvatar, onConfirm, onCancel }: Props) => {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Xử lý khi chọn/bỏ chọn một món ăn
  const toggleItemSelection = (itemId: string) => {
    if (selectedItemIds.includes(itemId)) {
      setSelectedItemIds(prev => prev.filter(id => id !== itemId));
    } else {
      setSelectedItemIds(prev => [...prev, itemId]);
    }
  };

  // Gán người vào các món đã chọn
  const assignMemberToSelectedItems = (memberId: string) => {
    const updatedItems = items.map(item => {
      if (selectedItemIds.includes(item.id)) {
        // Nếu người này chưa có trong list thì thêm vào, có rồi thì thôi (hoặc toggle tùy logic)
        const currentAssignees = item.assignedTo || [];
        const newAssignees = currentAssignees.includes(memberId)
          ? currentAssignees.filter(id => id !== memberId) // Toggle: Bấm lại thì bỏ ra
          : [...currentAssignees, memberId]; // Chưa có thì thêm vào
        
        return { ...item, assignedTo: newAssignees };
      }
      return item;
    });
    
    onUpdateItems(updatedItems);
  };

  const renderItem = ({ item }: { item: BillItem }) => {
    const isSelected = selectedItemIds.includes(item.id);
    
    return (
      <TouchableOpacity 
        style={[styles.itemRow, isSelected && styles.itemRowSelected]} 
        onPress={() => toggleItemSelection(item.id)}
      >
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name} (x{item.quantity})</Text>
          <Text style={styles.itemPrice}>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</Text>
        </View>
        
        {/* Hiển thị avatar những người đã được gán */}
        <View style={styles.assigneeContainer}>
          {item.assignedTo.length === 0 ? (
            <Text style={styles.unassignedText}>Chưa gán</Text>
          ) : (
            item.assignedTo.map(userId => (
              <Avatar 
                key={userId}
                name={getMemberName(userId)} 
                avatar={getMemberAvatar(userId)} 
                size={24} 
                style={{ marginLeft: -8, borderWidth: 1, borderColor: 'white' }}
              />
            ))
          )}
        </View>
        
        <Ionicons 
          name={isSelected ? "checkbox" : "square-outline"} 
          size={24} 
          color={isSelected ? APP_COLOR.ORANGE : "#ccc"} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
            <Text style={{color: '#666'}}>Hủy</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chia món</Text>
        <TouchableOpacity onPress={onConfirm}>
            <Text style={{color: APP_COLOR.ORANGE, fontWeight: 'bold'}}>Xong</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.guideText}>Chọn món rồi nhấn "Gán người"</Text>
        <TouchableOpacity 
          style={[styles.assignButton, selectedItemIds.length === 0 && styles.disabledButton]}
          disabled={selectedItemIds.length === 0}
          onPress={() => setShowMemberModal(true)}
        >
          <Text style={styles.assignButtonText}>Gán người ({selectedItemIds.length})</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
      />

      {/* Modal chọn người để gán */}
      <Modal visible={showMemberModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ai đã dùng các món này?</Text>
            <View style={styles.memberGrid}>
              {members.map(m => {
                 const memberId = m.user?.id || m.id; // Tùy cấu trúc object member của bạn
                 return (
                  <TouchableOpacity 
                    key={memberId} 
                    style={styles.memberItem}
                    onPress={() => assignMemberToSelectedItems(memberId)}
                  >
                    <Avatar name={getMemberName(memberId)} avatar={getMemberAvatar(memberId)} size={50} />
                    <Text style={styles.memberName} numberOfLines={1}>{getMemberName(memberId)}</Text>
                  </TouchableOpacity>
                 )
              })}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowMemberModal(false)}>
              <Text style={styles.closeButtonText}>Xong</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#f9f9f9' },
  guideText: { fontSize: 12, color: '#666' },
  assignButton: { backgroundColor: APP_COLOR.ORANGE, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  disabledButton: { backgroundColor: '#ccc' },
  assignButtonText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  list: { flex: 1 },
  itemRow: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  itemRowSelected: { backgroundColor: '#FFF3E0' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '500' },
  itemPrice: { fontSize: 14, color: '#888' },
  assigneeContainer: { flexDirection: 'row', marginRight: 10, paddingLeft: 10 },
  unassignedText: { fontSize: 10, color: '#aaa', fontStyle: 'italic' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  memberGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  memberItem: { alignItems: 'center', margin: 10, width: 70 },
  memberName: { marginTop: 5, fontSize: 12, textAlign: 'center' },
  closeButton: { marginTop: 20, backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, alignItems: 'center' },
  closeButtonText: { fontWeight: 'bold', color: '#333' },
});