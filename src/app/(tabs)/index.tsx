import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentApp } from '@/context/app.context';
import { APP_COLOR } from '@/utils/constant';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useGetGroups } from '@/api/hooks';
import Avatar from '@/component/Avatar';

const { width } = Dimensions.get('window');

const FeatureCard = ({ icon, title, description, color, onPress }: any) => (
  <TouchableOpacity style={styles.featureCard} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDesc}>{description}</Text>
  </TouchableOpacity>
);

const HomeTab = () => {
  const { appState } = useCurrentApp();
  const { data: groups, isLoading, refetch } = useGetGroups();

  // Lấy 3 nhóm gần nhất (giả sử API trả về theo thứ tự hoặc sort lại)
  const recentGroups = groups ? groups.slice(0, 3) : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.userName}>{appState?.userName || 'Bạn mới'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/account')}>
             {appState?.avatar ? (
                <Image source={{ uri: appState.avatar }} style={styles.avatar} />
             ) : (
                <Avatar name={appState?.userName || 'User'} size={45} />
             )}
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <LinearGradient
          colors={[APP_COLOR.ORANGE, '#FFB74D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Quản lý chi tiêu nhóm</Text>
            <Text style={styles.heroSubtitle}>
              Chia tiền công bằng, minh bạch và nhanh chóng chỉ với vài bước đơn giản.
            </Text>
            <TouchableOpacity 
                style={styles.heroButton}
                onPress={() => router.push('/(tabs)/groups')}
            >
              <Text style={styles.heroButtonText}>Bắt đầu ngay</Text>
              <Ionicons name="arrow-forward" size={16} color={APP_COLOR.ORANGE} />
            </TouchableOpacity>
          </View>
          <Ionicons name="wallet-outline" size={100} color="rgba(255,255,255,0.2)" style={styles.heroIcon} />
        </LinearGradient>

        {/* Features Grid */}
        <Text style={styles.sectionTitle}>Tính năng nổi bật</Text>
        <View style={styles.gridContainer}>
          <FeatureCard
            icon="people"
            title="Tạo Nhóm"
            description="Tạo nhóm cho chuyến đi, nhà trọ hoặc ăn uống."
            color="#4CAF50"
            onPress={() => router.push('/(tabs)/groups')}
          />
          <FeatureCard
            icon="receipt"
            title="Thêm Hóa Đơn"
            description="Ghi lại chi tiêu và chọn người chia tiền."
            color="#2196F3"
            onPress={() => router.push('/(tabs)/groups')}
          />
          <FeatureCard
            icon="pie-chart"
            title="Thống Kê"
            description="Xem biểu đồ chi tiêu và công nợ chi tiết."
            color="#9C27B0"
            onPress={() => router.push('/(tabs)/groups')}
          />
          <FeatureCard
            icon="notifications"
            title="Nhắc Nợ"
            description="Gửi thông báo nhắc nhở thanh toán dễ dàng."
            color="#FF9800"
            onPress={() => {}}
          />
        </View>

        {/* Recent Groups */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nhóm gần đây</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/groups')}>
                <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
        </View>
        
        {recentGroups.length > 0 ? (
            <View style={styles.groupList}>
                {recentGroups.map((group) => (
                    <TouchableOpacity 
                        key={group.id} 
                        style={styles.groupItem}
                        onPress={() => router.push({
                            pathname: '/(tabs)/groups/[groupId]',
                            params: { groupId: group.id }
                        })}
                    >
                        <View style={[styles.groupIcon, { backgroundColor: '#E0EFFF' }]}>
                            <Ionicons name="people" size={24} color="#007AFF" />
                        </View>
                        <View style={styles.groupInfo}>
                            <Text style={styles.groupName}>{group.groupName}</Text>
                            <Text style={styles.groupDesc} numberOfLines={1}>
                                {group.description || 'Không có mô tả'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                ))}
            </View>
        ) : (
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Bạn chưa tham gia nhóm nào.</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/groups')}>
                    <Text style={styles.createLink}>Tạo nhóm mới ngay</Text>
                </TouchableOpacity>
            </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  
  // Hero
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    position: 'relative',
    overflow: 'hidden',
    height: 160,
    justifyContent: 'center',
  },
  heroContent: {
    zIndex: 1,
    width: '80%',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 15,
    lineHeight: 18,
  },
  heroButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroButtonText: {
    color: APP_COLOR.ORANGE,
    fontWeight: 'bold',
    fontSize: 13,
  },
  heroIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
  },

  // Grid
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  featureCard: {
    width: (width - 55) / 2, // 2 columns with padding
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },

  // Recent Groups
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
  },
  seeAll: {
      color: APP_COLOR.ORANGE,
      fontSize: 13,
      fontWeight: '600',
  },
  groupList: {
      gap: 10,
  },
  groupItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      padding: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#F0F0F0',
  },
  groupIcon: {
      width: 45,
      height: 45,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
  },
  groupInfo: {
      flex: 1,
  },
  groupName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: 2,
  },
  groupDesc: {
      fontSize: 13,
      color: '#888',
  },
  emptyState: {
      alignItems: 'center',
      padding: 20,
      backgroundColor: 'white',
      borderRadius: 12,
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: '#ccc',
  },
  emptyText: {
      color: '#888',
      marginBottom: 5,
  },
  createLink: {
      color: APP_COLOR.ORANGE,
      fontWeight: 'bold',
  },
});

export default HomeTab;
