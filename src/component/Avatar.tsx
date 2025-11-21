// src/component/Avatar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722',
  '#795548', '#9E9E9E', '#607D8B'
];

// Hàm helper lấy màu từ danh sách dựa trên tên
const getColor = (name: string) => {
  if (!name) return '#ccc';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % COLORS.length);
  return COLORS[index];
};

// Hàm helper lấy 2 chữ cái đầu
const getInitials = (name: string) => {
  if (!name) return '?';
  const names = name.trim().split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

interface AvatarProps {
  name: string;
  size?: number;
  style?: any;
}

const Avatar = ({ name, size = 40, style }: AvatarProps) => {
  // Luôn render View để giữ layout, nếu không có tên thì hiển thị ?
  const displayName = name || '?';
  const initials = getInitials(displayName);
  const color = getColor(displayName);

  return (
    <View style={[styles.avatar, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }, style]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Avatar;