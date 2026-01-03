import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Avatar from '@/component/Avatar';
import { APP_COLOR } from '@/utils/constant';
import { SplitInput, SplitMethod } from '@/hooks/useExpenseCreation';

interface Props {
  inputs: SplitInput[]; splitMethod: SplitMethod;
  onToggle: (id: string) => void; onInput: (id: string, val: string) => void;
  getAvatar: (id: string) => string | null;
}

export const SplitList = ({ inputs, splitMethod, onToggle, onInput, getAvatar }: Props) => {
  // Sort: Checked first
  const sorted = [...inputs].sort((a, b) => (a.isChecked === b.isChecked ? 0 : a.isChecked ? -1 : 1));
  const isEditable = splitMethod !== 'EQUAL';

  return (
    <View style={styles.container}>
      {sorted.map(item => (
        <TouchableOpacity key={item.userId} style={[styles.splitItem, !item.isChecked && styles.disabled]} onPress={() => onToggle(item.userId)} activeOpacity={0.7}>
          <View style={styles.left}>
            <View style={styles.avatarBox}>
              <Avatar name={item.name} avatar={getAvatar(item.userId)} size={40} />
              {item.isChecked && <View style={styles.badge}><Ionicons name="checkmark" size={10} color="white" /></View>}
            </View>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          </View>
          <View style={styles.right}>
            {item.isChecked ? (
              <View style={{ alignItems: 'flex-end' }}>
                {isEditable && (
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      value={item.isManual ? item.value : ''}
                      onChangeText={(t) => onInput(item.userId, t)}
                      keyboardType="numeric"
                      placeholder={splitMethod === 'SHARES' ? '1' : '0'}
                      placeholderTextColor="#999"
                      selectTextOnFocus={true}
                      selectionColor={APP_COLOR.ORANGE}
                      onFocus={(e) => e.stopPropagation()}
                    />
                    {splitMethod === 'PERCENTAGE' && <Text style={styles.unit}>%</Text>}
                    {splitMethod === 'SHARES' && <Text style={styles.unit}>phần</Text>}
                  </View>
                )}
                <Text style={styles.amount}>{item.calculatedAmount?.toLocaleString('vi-VN')}đ</Text>
              </View>
            ) : <Text style={styles.unchecked}>Không tham gia</Text>}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 10 },
  splitItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  disabled: { opacity: 0.6 },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarBox: { marginRight: 12 },
  badge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: APP_COLOR.ORANGE, borderRadius: 10, width: 16, height: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fff' },
  name: { fontSize: 16, color: '#333', fontWeight: '500', flex: 1 },
  right: { alignItems: 'flex-end', minWidth: 80 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: APP_COLOR.ORANGE, marginBottom: 4 },
  input: { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'right', paddingVertical: 2, minWidth: 40 },
  unit: { fontSize: 14, color: '#666', marginLeft: 2 },
  amount: { fontSize: 14, fontWeight: '500', color: '#666' },
  unchecked: { fontSize: 12, color: '#999' },
});