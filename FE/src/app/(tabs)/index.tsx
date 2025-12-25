import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCurrentApp } from "@/context/app.context";
import { APP_COLOR } from "@/utils/constant";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useGetGroups } from "@/api/hooks";
import Avatar from "@/component/Avatar";
import { SelectionModal } from "@/component/expense/SelectionModal";
import { JoinGroupModal } from "@/component/group/JoinGroupModal";

const { width } = Dimensions.get("window");

const getInitials = (name: string) => {
  if (!name) return "G";
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const VerticalFeatureCard = ({
  icon,
  title,
  description,
  color,
  bgColor,
  onPress,
}: any) => (
  <TouchableOpacity
    style={styles.verticalCard}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View
      style={[
        styles.iconContainer,
        { backgroundColor: bgColor, marginBottom: 12 },
      ]}
    >
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDesc}>{description}</Text>
  </TouchableOpacity>
);

const HorizontalFeatureCard = ({
  icon,
  title,
  description,
  color,
  bgColor,
  onPress,
}: any) => (
  <TouchableOpacity
    style={styles.horizontalCard}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.horizontalCardContent}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: bgColor, marginRight: 15 },
        ]}
      >
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{description}</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#ccc" />
  </TouchableOpacity>
);

const HomeTab = () => {
  const { appState } = useCurrentApp();
  const { data: groups, isLoading, refetch } = useGetGroups();
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showNoGroupModal, setShowNoGroupModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleCreateBillPress = () => {
    if (!groups || groups.length === 0) {
      setShowNoGroupModal(true);
      return;
    }
    setShowGroupModal(true);
  };

  const handleGroupSelect = (groupId: string) => {
    setShowGroupModal(false);
    router.push({
      pathname: "/(tabs)/groups/create-bill",
      params: { groupId },
    });
  };

  // Lấy 3 nhóm gần nhất (giả sử API trả về theo thứ tự hoặc sort lại)
  const recentGroups = groups ? groups.slice(0, 3) : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.userName}>
              {appState?.userName || "Bạn mới"}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/account")}>
            <Avatar
              name={appState?.userName || "User"}
              avatar={appState?.avatar}
              size={45}
            />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <LinearGradient
          colors={[APP_COLOR.ORANGE, "#FF9800"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Quản lý chi tiêu nhóm</Text>
            <Text style={styles.heroSubtitle}>
              Chia tiền công bằng, minh bạch và nhanh chóng chỉ với vài bước đơn
              giản.
            </Text>
            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => router.push("/(tabs)/groups")}
              activeOpacity={0.9}
            >
              <Text style={styles.heroButtonText}>Bắt đầu ngay</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={APP_COLOR.ORANGE}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.heroIconContainer}>
            <Ionicons name="wallet" size={80} color="rgba(255,255,255,0.2)" />
            <View style={styles.heroIconCircle} />
          </View>
        </LinearGradient>

        {/* Features Grid */}
        <Text style={styles.sectionTitle}>Tính năng nổi bật</Text>
        <View style={styles.gridContainer}>
          <View style={styles.rowContainer}>
            <VerticalFeatureCard
              icon="receipt-outline"
              title="Tạo Bill"
              description="Thêm chi tiêu mới vào nhóm."
              color="#E65100"
              bgColor="#FFF3E0"
              onPress={handleCreateBillPress}
            />
            <VerticalFeatureCard
              icon="person-add-outline"
              title="Tạo Nhóm"
              description="Tạo nhóm cho chuyến đi, ăn uống."
              color="#2E7D32"
              bgColor="#E8F5E9"
              onPress={() => router.push("/create-group")}
            />
          </View>
          <HorizontalFeatureCard
            icon="pie-chart-outline"
            title="Thống Kê"
            description="Xem biểu đồ chi tiêu theo tuần, tháng."
            color="#7B1FA2"
            bgColor="#F3E5F5"
            onPress={() => router.push("/statistics")}
          />
        </View>

        {/* Recent Groups */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nhóm gần đây</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/groups")}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {recentGroups.length > 0 ? (
          <View style={styles.groupList}>
            {recentGroups.map((group, index) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupItem}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/groups/[groupId]",
                    params: { groupId: group.id },
                  })
                }
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.groupIcon,
                    {
                      backgroundColor: index % 2 === 0 ? "#E3F2FD" : "#E8EAF6",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.groupInitials,
                      { color: index % 2 === 0 ? "#1565C0" : "#3F51B5" },
                    ]}
                  >
                    {getInitials(group.groupName)}
                  </Text>
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.groupName}</Text>
                  <Text style={styles.groupDesc}>
                    {group.createdTime ? "Cập nhật hôm qua" : "Vừa xong"}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#E0E0E0"
                  style={{ marginLeft: 5 }}
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Bạn chưa tham gia nhóm nào.</Text>
            <TouchableOpacity onPress={() => router.push("/create-group")}>
              <Text style={styles.createLink}>Tạo nhóm mới ngay</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <SelectionModal
        visible={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title="Chọn nhóm"
        options={
          groups?.map((g) => ({ label: g.groupName, value: g.id })) || []
        }
        onSelect={handleGroupSelect}
        selectedValue=""
      />

      <Modal
        transparent
        visible={showNoGroupModal}
        animationType="fade"
        onRequestClose={() => setShowNoGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Ionicons
                name="people-circle-outline"
                size={60}
                color={APP_COLOR.ORANGE}
              />
            </View>
            <Text style={styles.modalTitle}>Chưa có nhóm</Text>
            <Text style={styles.modalMessage}>
              Bạn cần tham gia hoặc tạo một nhóm để bắt đầu thêm chi tiêu.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  setShowNoGroupModal(false);
                  router.push("/create-group");
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>Tạo nhóm mới</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowNoGroupModal(false);
                  setShowJoinModal(true);
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>
                  Tham gia nhóm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButtonTextOnly}
                onPress={() => setShowNoGroupModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Để sau</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <JoinGroupModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA", // Slightly lighter/cooler gray
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  greeting: {
    fontSize: 15,
    color: "#757575",
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "white",
  },

  // Hero
  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    position: "relative",
    overflow: "hidden",
    height: 180,
    justifyContent: "center",
    shadowColor: APP_COLOR.ORANGE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  heroContent: {
    zIndex: 2,
    width: "75%",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
    marginBottom: 20,
    lineHeight: 20,
  },
  heroButton: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 30,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroButtonText: {
    color: APP_COLOR.ORANGE,
    fontWeight: "bold",
    fontSize: 14,
  },
  heroIconContainer: {
    position: "absolute",
    right: -10,
    bottom: -10,
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  heroIconCircle: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    transform: [{ rotate: "15deg" }],
  },

  // Grid
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 15,
  },
  gridContainer: {
    gap: 15,
    marginBottom: 30,
  },
  rowContainer: {
    flexDirection: "row",
    gap: 15,
  },
  verticalCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 140,
  },
  horizontalCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  horizontalCardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: "#757575",
    lineHeight: 18,
  },

  // Recent Groups
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  seeAll: {
    color: APP_COLOR.ORANGE,
    fontSize: 14,
    fontWeight: "600",
  },
  groupList: {
    gap: 12,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  groupIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  groupInitials: {
    fontSize: 18,
    fontWeight: "bold",
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  groupDesc: {
    fontSize: 13,
    color: "#9E9E9E",
  },
  groupBalance: {
    alignItems: "flex-end",
    marginRight: 5,
  },
  balanceAmount: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 2,
  },
  balanceLabel: {
    fontSize: 11,
    color: "#9E9E9E",
  },
  emptyState: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "white",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  emptyText: {
    color: "#757575",
    marginBottom: 8,
    fontSize: 15,
  },
  createLink: {
    color: APP_COLOR.ORANGE,
    fontWeight: "bold",
    fontSize: 15,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 28,
    padding: 30,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    color: "#757575",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  modalActions: {
    width: "100%",
    gap: 12,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonPrimary: {
    backgroundColor: APP_COLOR.ORANGE,
    shadowColor: APP_COLOR.ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonSecondary: {
    backgroundColor: "#F5F5F5",
  },
  modalButtonTextPrimary: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalButtonTextSecondary: {
    color: "#1A1A1A",
    fontWeight: "600",
    fontSize: 16,
  },
  modalButtonTextOnly: {
    paddingVertical: 10,
    alignItems: "center",
  },
  modalButtonTextCancel: {
    color: "#9E9E9E",
    fontSize: 15,
    fontWeight: "500",
  },
});

export default HomeTab;
