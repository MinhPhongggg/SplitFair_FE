import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useGetNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useGetGroupById,
  useGetExpenseById,
} from "@/api/hooks";
import { Notification } from "@/types/notification.types";
import { APP_COLOR } from "@/utils/constant";
import Ionicons from "@expo/vector-icons/Ionicons";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { router } from "expo-router";
import { getGroupById } from "@/api/groups"; // Import direct API calls
import { getExpenseById } from "@/api/expense";
import Header from "@/component/Header";

const NotificationPage = () => {
  const {
    data: notifications,
    isLoading,
    refetch,
    isError,
  } = useGetNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead();

  // Kiểm tra dữ liệu hợp lệ (do axios interceptor có thể trả về object lỗi thay vì throw)
  const isValidData = Array.isArray(notifications);
  const notificationList = isValidData ? notifications : [];

  const handlePressNotification = async (item: Notification) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }

    try {
      // Điều hướng dựa trên loại thông báo
      if (item.type === "GROUP_INVITE" && item.referenceId) {
        // Kiểm tra tồn tại trước khi navigate
        try {
          await getGroupById(item.referenceId);
          router.push({
            pathname: "/(tabs)/groups/[groupId]",
            params: { groupId: item.referenceId },
          });
        } catch (e) {
          Alert.alert("Thông báo", "Nhóm này không còn tồn tại.");
        }
      } else if (item.type === "EXPENSE_ADDED" && item.referenceId) {
        try {
          await getExpenseById(item.referenceId);
          router.push({
            pathname: "/(tabs)/groups/expense/[expenseId]",
            params: { expenseId: item.referenceId },
          });
        } catch (e) {
          Alert.alert("Thông báo", "Chi tiêu này không còn tồn tại.");
        }
      } else if (item.type === "DEBT_REMINDER" && item.referenceId) {
        // referenceId ở đây là groupId (đã sửa ở backend) hoặc userId
        // Nếu là groupId thì check group
        // Nếu là userId thì có thể navigate đến profile hoặc chat (chưa implement)
        // Tạm thời giả định là groupId nếu có thể parse UUID, hoặc check logic backend

        // Logic backend mới: referenceId = groupId (nếu có) hoặc fromUserId
        // Ta thử check group trước
        try {
          await getGroupById(item.referenceId);
          router.push({
            pathname: "/(tabs)/groups/[groupId]",
            params: { groupId: item.referenceId },
          });
        } catch (e) {
          // Nếu không phải group, có thể là user ID, nhưng hiện tại chưa có màn hình user detail từ noti
          // Hoặc đơn giản là group đã bị xóa
          Alert.alert(
            "Thông báo",
            "Nhóm liên quan không còn tồn tại hoặc đã bị xóa."
          );
        }
      }
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    let iconName: any = "notifications";
    let iconColor = APP_COLOR.ORANGE;
    let bgColor = item.isRead ? "white" : "#FFF9F0"; // Màu nền khác cho tin chưa đọc

    switch (item.type) {
      case "GROUP_INVITE":
        iconName = "people";
        iconColor = "#4CAF50";
        break;
      case "EXPENSE_ADDED":
        iconName = "receipt";
        iconColor = "#2196F3";
        break;
      case "DEBT_REMINDER":
        iconName = "alert-circle";
        iconColor = "#FF9800";
        break;
      case "DEBT_SETTLED":
        iconName = "checkmark-circle";
        iconColor = "#009688";
        break;
    }

    return (
      <TouchableOpacity
        style={[styles.itemContainer, { backgroundColor: bgColor }]}
        onPress={() => handlePressNotification(item)}
      >
        <View style={[styles.iconBox, { backgroundColor: iconColor + "20" }]}>
          <Ionicons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.contentBox}>
          <Text style={[styles.title, !item.isRead && styles.boldTitle]}>
            {item.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.time}>
            {item.createdTime
              ? formatDistanceToNow(new Date(item.createdTime), {
                  addSuffix: true,
                  locale: vi,
                })
              : ""}
          </Text>
        </View>
        {!item.isRead && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={APP_COLOR.ORANGE} />
      </View>
    );
  }

  // Hiển thị lỗi nếu có
  if (isError || (!isLoading && !isValidData && notifications)) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={{ marginTop: 10, color: "red" }}>
          Không thể tải thông báo.
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={{
            marginTop: 20,
            padding: 10,
            backgroundColor: "#eee",
            borderRadius: 8,
          }}
        >
          <Text>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Thông báo"
        rightIcon={
          <TouchableOpacity
            onPress={() => markAllAsRead()}
            disabled={isMarkingAll}
            style={styles.readAllBtn}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={20}
              color={APP_COLOR.ORANGE}
            />
            <Text style={styles.readAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={notificationList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[APP_COLOR.ORANGE]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Bạn không có thông báo nào.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#333" },
  readAllBtn: { flexDirection: "row", alignItems: "center" },
  readAllText: { color: APP_COLOR.ORANGE, marginLeft: 5, fontWeight: "600" },

  listContent: { paddingBottom: 20 },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  contentBox: { flex: 1 },
  title: { fontSize: 16, color: "#333", marginBottom: 4 },
  boldTitle: { fontWeight: "bold" },
  message: { fontSize: 14, color: "#666", marginBottom: 6 },
  time: { fontSize: 12, color: "#999" },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: APP_COLOR.ORANGE,
    marginLeft: 10,
  },

  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 10, color: "gray", fontSize: 16 },
});

export default NotificationPage;
