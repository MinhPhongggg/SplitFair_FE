import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { APP_COLOR } from '@/utils/constant';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  subMessage?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'warning';
  icon?: keyof typeof Ionicons.glyphMap; // Cho phép custom icon
  hideIcon?: boolean;
  hideCancel?: boolean;
  variant?: 'default' | 'material';
}

const ConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  subMessage,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy',
  type = 'info',
  icon,
  hideIcon = false,
  hideCancel = false,
  variant = 'default',
}: ConfirmModalProps) => {
  // Xác định icon mặc định dựa trên type nếu không có icon truyền vào
  const defaultIcon = type === 'danger' ? "trash-outline" : "information-circle-outline";
  const iconName = icon || defaultIcon;

  if (variant === 'material') {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.materialContainer}>
            <View style={styles.materialContent}>
              <Text style={styles.materialTitle}>{title}</Text>
              {typeof message === 'string' ? (
                 <Text style={styles.materialMessage}>{message}</Text>
              ) : (
                 <Text style={styles.materialMessage}>{message}</Text>
              )}
              {subMessage && <Text style={styles.materialSubMessage}>{subMessage}</Text>}
            </View>
            <View style={styles.materialButtonRow}>
              {!hideCancel && (
                <TouchableOpacity 
                  style={styles.materialButton} 
                  onPress={onClose}
                >
                  <Text style={styles.materialCancelText}>{cancelText}</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.materialButton} 
                onPress={() => {
                  onClose();
                  setTimeout(onConfirm, 200);
                }}
              >
                <Text style={[styles.materialConfirmText, { color: APP_COLOR.ORANGE }]}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon Header */}
          {!hideIcon && (
            <View style={[styles.iconContainer, type === 'danger' ? styles.iconDanger : styles.iconInfo]}>
                <Ionicons 
                name={iconName} 
                size={36} 
                color={type === 'danger' ? "#FF3B30" : APP_COLOR.ORANGE} 
                />
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message as string}</Text>

          <View style={styles.buttonRow}>
            {!hideCancel && (
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.confirmButton, type === 'danger' ? styles.confirmDanger : styles.confirmInfo]} 
              onPress={() => {
                onClose();
                setTimeout(onConfirm, 200); // Delay slightly for animation
              }}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // ... Existing styles ...
  container: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  // Material Styles
  materialContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  materialContent: {
    padding: 24,
  },
  materialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827', // Gray-900
    marginBottom: 8,
  },
  materialMessage: {
    fontSize: 16,
    color: '#4B5563', // Gray-600
    lineHeight: 24,
  },
  materialSubMessage: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF', // Gray-400
  },
  materialButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  materialButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  materialCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563', // Gray-600
  },
  materialConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    // Color set inline
  },

  // Existing styles continued...
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconInfo: {
    backgroundColor: '#FFF5E5', // Light Orange
  },
  iconDanger: {
    backgroundColor: '#FFEEEE', // Light Red
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmInfo: {
    backgroundColor: APP_COLOR.ORANGE,
  },
  confirmDanger: {
    backgroundColor: '#FF3B30',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default ConfirmModal;
