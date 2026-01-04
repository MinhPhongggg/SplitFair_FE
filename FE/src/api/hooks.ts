// src/api/hooks.ts (Phiên bản đồng nhất cuối cùng)

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { IUserAuth } from '@/context/app.context'; 
import { Alert } from 'react-native';

// 1. IMPORT CÁC TYPES ĐÃ ĐỒNG NHẤT
import { Group, GroupMember, CreateGroupPayload } from '@/types/group.types';
import { User } from '@/types/user.types';
import { Expense, ExpenseShareSaveRequest, ExpenseShare } from '@/types/expense.types';
import { Bill } from '@/types/bill.types';
import { Category } from '@/types/category.types';
import { Balance, PaymentStat } from '@/types/stats.types';
import { Notification } from '@/types/notification.types';
import { useCurrentApp } from '@/context/app.context';

// 2. IMPORT CÁC HÀM API ĐÃ ĐỒNG NHẤT
// Auth API (từ file có sẵn của splitapp-fe)
import { loginAPI, registerAPI, changePasswordAPI } from '@/utils/api';

// Các API tính năng
import {
  createGroup,
  getGroups,
  getGroupById,
  getGroupMembers,
  addMember,
  removeMember,
  updateGroup,
  deleteGroup,
} from '@/api/groups';
import { getAllUsers, searchUsers, updateUser, uploadAvatarAPI, updateMyBankInfo, BankInfoRequest } from '@/api/users';
import {
  getExpensesByBill,
  createExpense,
  saveExpenseShares,
  deleteExpense,
  getExpensesByGroup,
  getExpenseById,
  getSharesByExpense,
  updateExpense,
  getSharesByUser,
} from '@/api/expense';
import { getAllDebtsByUser, getReadableBalances, markDebtAsSettled, settleBatchDebts, requestPayment, confirmPayment, rejectPayment } from '@/api/debt';
import { createBill, getBillsByGroup, getBillById, deleteBill } from '@/api/bills';
import { getAllCategories } from '@/api/category';
import { getGroupPaymentStats, getGroupBalances } from '@/api/stats';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@/api/notifications';
import { Debt, VietQrDTO } from '@/types/debt.types';

// --- Auth Hooks (Sử dụng api.ts của splitapp-fe) ---
interface LoginPayload {
  email: string;
  password: string;
}
export const useLogin = () => {
  return useMutation<IUserAuth, AxiosError, LoginPayload>({
    mutationFn: (payload) => loginAPI(payload.email, payload.password),
  });
};

interface RegisterPayload {
  userName: string;
  email: string;
  password: string;
}
export const useRegister = () => {
  return useMutation<IUserAuth, AxiosError, RegisterPayload>({
    mutationFn: (payload) =>
      registerAPI(payload.userName, payload.email, payload.password),
  });
};

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const useChangePassword = () => {
  return useMutation<void, AxiosError, ChangePasswordPayload>({
    mutationFn: (payload) => changePasswordAPI(payload.currentPassword, payload.newPassword),
  });
};

// --- User Hooks ---
export const useUserSearch = (query: string) => {
  return useQuery<User[], AxiosError>({
    queryKey: ['users', 'search', query],
    queryFn: () => searchUsers(query),
    enabled: query.length > 1,
  });
};


export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { setAppState, appState } = useCurrentApp(); // Lấy context

  return useMutation<User, AxiosError, Partial<User>>({
    // Backend của bạn nhận UserDTO (có 'name'), không phải 'userName'
    mutationFn: (payload) => updateUser(payload.id as string, payload),
    
    onSuccess: (data, variables) => { // 'data' là UserDTO trả về từ BE
      // 1. Cập nhật lại AppContext state
      if (appState) {
        setAppState({
          ...appState,
          userName: data.name, // BE trả về 'name'
          email: data.email,
          // Ưu tiên lấy từ response, nếu không có thì lấy từ payload gửi đi (variables), cuối cùng mới giữ nguyên cũ
          avatar: data.avatar || variables.avatar || appState.avatar, 
        });
      }
      // 3. Làm mới các query liên quan (ví dụ: danh sách thành viên)
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['group', 'members'] }); // Làm mới tất cả cache thành viên
    },
    onError: (err: any) => {
       Alert.alert('Lỗi', err.response?.data?.message || err.message);
    }
  });
};



export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const { setAppState, appState } = useCurrentApp();

  return useMutation<User, AxiosError, { userId: string; formData: FormData }>({
    mutationFn: (payload) => uploadAvatarAPI(payload.userId, payload.formData),
    
    onSuccess: (data) => {
      // 👇 Thêm log để kiểm tra xem API trả về gì
      console.log("Upload success, data:", data);

      if (data && (data as any).avatar) {
        if (appState) {
          setAppState({ ...appState, avatar: (data as any).avatar });
        }
        Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện.');
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } else {
        // Nếu data có vấn đề
        console.error("Data trả về không có avatar:", data);
        Alert.alert('Lỗi', 'Upload thành công nhưng không nhận được dữ liệu ảnh mới.');
      }
    },
    onError: (err: any) => {
      console.error("Upload error:", err);
       Alert.alert('Lỗi Upload', err.message || "Có lỗi xảy ra");
    }
  });
};

// Hook cập nhật thông tin ngân hàng
export const useUpdateBankInfo = () => {
  const { setAppState, appState } = useCurrentApp();

  return useMutation<void, AxiosError, BankInfoRequest>({
    mutationFn: (request) => updateMyBankInfo(request),
    onSuccess: (_, variables) => {
      // Cập nhật context với thông tin bank mới
      if (appState) {
        setAppState({
          ...appState,
          bankCode: variables.bankCode,
          bankAccountNo: variables.bankAccountNo,
          bankAccountName: variables.bankAccountName,
        });
      }
    },
  });
};

// --- Group Hooks ---
export const useGetGroups = () => {
  return useQuery<Group[], AxiosError>({
    queryKey: ['groups'],
    queryFn: getGroups,
  });
};

export const useGetGroupById = (groupId: string) => {
  return useQuery<Group, AxiosError>({
    queryKey: ['group', groupId],
    queryFn: () => getGroupById(groupId),
    enabled: !!groupId,
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation<Group, AxiosError, CreateGroupPayload>({
    mutationFn: (payload) => createGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};

// --- Group Member Hooks ---
export const useGetGroupMembers = (groupId: string) => {
  return useQuery<GroupMember[], AxiosError>({
    queryKey: ['group', groupId, 'members'],
    queryFn: () => getGroupMembers(groupId),
    enabled: !!groupId,
  });
};

export const useAddMember = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation<string, AxiosError, { userId: string }>({
    mutationFn: (payload) => addMember(groupId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    },
  });
};

export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  return useMutation<string, AxiosError, { groupId: string; userId: string }>({
    mutationFn: (payload) => addMember(payload.groupId, { userId: payload.userId }),
    onSuccess: (data, variables) => {
      // Refresh group list
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      // Refresh specific group if needed
      queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] });
    },
  });
};

export const useRemoveMember = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, { memberId: string }>({
    mutationFn: (payload) => removeMember(payload.memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    },
  });
};

// --- Expense & Share Hooks ---
export const useGetExpensesByBill = (billId: string) => {
  return useQuery<Expense[], AxiosError>({
    queryKey: ['expenses', billId],
    queryFn: () => getExpensesByBill(billId),
    enabled: !!billId,
  });
};

export const useCreateExpense = (billId: string) => {
  const queryClient = useQueryClient();

  return useMutation<Expense, AxiosError, Partial<Expense>>({
    mutationFn: (payload) => createExpense(payload),
    
    onSuccess: (newExpense) => {
      const groupId = newExpense.groupId;

      // 1. Cập nhật ngay lập tức danh sách chi tiêu trong Bill này
      // (Giúp màn hình Chi tiết Bill cập nhật liền)
      queryClient.invalidateQueries({ queryKey: ['expenses', billId] });

      // 2. Cập nhật ngay lập tức danh sách chi tiêu của cả Group 
      // (Giúp tab "Giao dịch" trong GroupStatsTab cập nhật liền)
      queryClient.invalidateQueries({ queryKey: ['groupExpenses', groupId] });

      // 3. Cập nhật các thông số thống kê (Tổng tiền, Biểu đồ)
      queryClient.invalidateQueries({ queryKey: ['stats', 'payment', groupId] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'balances', groupId] });
      
      // 4. Cập nhật thông tin Bill (Tổng tiền Bill tăng lên)
      queryClient.invalidateQueries({ queryKey: ['bill', billId] });
      queryClient.invalidateQueries({ queryKey: ['bills', groupId] });
    },
  });
};

export const useSaveExpenseShares = (groupId?: string) => {
  const queryClient = useQueryClient();
  return useMutation<any, AxiosError, ExpenseShareSaveRequest>({
    mutationFn: (payload) => saveExpenseShares(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      if (groupId) {
        // Cập nhật lại thống kê và số dư của nhóm sau khi chia tiền xong
        queryClient.invalidateQueries({ queryKey: ['stats', 'balances', groupId] });
        queryClient.invalidateQueries({ queryKey: ['stats', 'payment', groupId] });
      }
    },
  });
};

// --- Bill Hooks ---
export const useCreateBill = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation<Bill, AxiosError, Partial<Bill>>({
    mutationFn: (payload) => createBill(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills', groupId] });
    },
  });
};
export const useGetBillsByGroup = (groupId: string) => {
  return useQuery<Bill[], AxiosError>({
    queryKey: ['bills', groupId],
    queryFn: () => getBillsByGroup(groupId),
    enabled: !!groupId, // Chỉ chạy khi có groupId
  });
};

export const useGetBillById = (billId: string) => {
  return useQuery<Bill, AxiosError>({
    queryKey: ['bill', billId],
    queryFn: () => getBillById(billId),
    enabled: !!billId, // Chỉ chạy khi có billId
  });
};

export const useDeleteBill = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, string>({
    mutationFn: (billId) => deleteBill(billId),
    onSuccess: () => {
      // Làm mới lại 3 thứ:
      // 1. Danh sách hóa đơn (để xóa bill này khỏi list)
      queryClient.invalidateQueries({ queryKey: ['bills', groupId] });
      // 2. Thống kê (vì tổng tiền/nợ đã thay đổi)
      queryClient.invalidateQueries({ queryKey: ['stats', 'payment', groupId] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'balances', groupId] });
      // 3. Danh sách chi tiêu (của cả nhóm)
      queryClient.invalidateQueries({ queryKey: ['groupExpenses', groupId] });
    },
  });
};
export const useDeleteExpense = (groupId: string, billId: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, string>({
    mutationFn: (expenseId) => deleteExpense(expenseId),
    onSuccess: () => {
      // 2. (SỬA) Làm mới tất cả các query bị ảnh hưởng

      // Làm mới danh sách expense trong bill này
      queryClient.invalidateQueries({ queryKey: ['expenses', billId] });
      
      // Làm mới chi tiết bill này (để cập nhật TỔNG TIỀN)
      queryClient.invalidateQueries({ queryKey: ['bill', billId] });
      
      // Làm mới danh sách bill trong group
      queryClient.invalidateQueries({ queryKey: ['bills', groupId] });
      
      // Làm mới cả 2 loại thống kê (vì nợ và tổng trả đã thay đổi)
      queryClient.invalidateQueries({ queryKey: ['stats', 'payment', groupId] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'balances', groupId] });
      
      // Làm mới danh sách expense của cả nhóm (phòng trường hợp)
      queryClient.invalidateQueries({ queryKey: ['groupExpenses', groupId] });
    },
  });
};

// --- Category Hooks ---
export const useGetCategories = () => {
  return useQuery<Category[], AxiosError>({
    queryKey: ['categories'],
    queryFn: getAllCategories,
    staleTime: 1000 * 60 * 5, // Cache danh mục trong 5 phút
  });
};

// --- Debt & Stats Hooks ---
export const useGetReadableBalances = () => {
  return useQuery<string[], AxiosError>({
    queryKey: ['balances'],
    queryFn: getReadableBalances,
  });
};

export const useGetGroupPaymentStats = (groupId: string) => {
  return useQuery<PaymentStat[], AxiosError>({
    queryKey: ['stats', 'payment', groupId],
    queryFn: () => getGroupPaymentStats(groupId),
    enabled: !!groupId,
  });
};

export const useGetGroupBalances = (groupId: string) => {
  return useQuery<Balance[], AxiosError>({
    queryKey: ['stats', 'balances', groupId],
    queryFn: () => getGroupBalances(groupId),
    enabled: !!groupId,
  });
};

export const useGetExpensesByGroup = (groupId: string) => {
  return useQuery<Expense[], AxiosError>({
    queryKey: ['groupExpenses', groupId],
    queryFn: () => getExpensesByGroup(groupId),
    enabled: !!groupId,
  });
};

export const useGetExpenseById = (expenseId: string) => {
  return useQuery<Expense, AxiosError>({
    queryKey: ['expense', expenseId],
    queryFn: () => getExpenseById(expenseId),
    enabled: !!expenseId,
  });
};

// 👇 HOOK MỚI (Lấy các phần chia của chi tiêu)
export const useGetSharesByExpense = (expenseId: string, enabled: boolean = true) => {
  return useQuery<ExpenseShare[], AxiosError>({
    queryKey: ['expenseShares', expenseId],
    queryFn: () => getSharesByExpense(expenseId),
    enabled: !!expenseId && enabled,
  });
};

export const useUpdateExpense = (expenseId: string, groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation<Expense, AxiosError, Partial<Expense>>({
    mutationFn: (payload) => updateExpense(expenseId, payload),
    
    // 1. Nhận 'data' (là expense đã cập nhật) trả về
    onSuccess: (data) => {
      const billId = data.billId; // Lấy billId từ expense

      // 2. Làm mới tất cả các query liên quan
      
      // (Cũ) Làm mới chi tiết expense và danh sách expense
      queryClient.invalidateQueries({ queryKey: ['expense', expenseId] });
      queryClient.invalidateQueries({ queryKey: ['groupExpenses', groupId] });

      // (Cũ) Làm mới biểu đồ tròn (Thành viên đã trả)
      queryClient.invalidateQueries({ queryKey: ['stats', 'payment', groupId] });

      // 👇 SỬA LỖI: Thêm 2 dòng này
      
      // 3. (MỚI) Làm mới CÔNG NỢ
      queryClient.invalidateQueries({ queryKey: ['stats', 'balances', groupId] });
      
      // 4. (MỚI) Làm mới TỔNG BILL (cả chi tiết và danh sách)
      queryClient.invalidateQueries({ queryKey: ['bill', billId] });
      queryClient.invalidateQueries({ queryKey: ['bills', groupId] });
      queryClient.invalidateQueries({ queryKey: ['expenses', billId] });
    },
  });
};

export const useGetSharesByUser = (userId: string) => {
  return useQuery<ExpenseShare[], AxiosError>({
    queryKey: ['userShares', userId],
    queryFn: () => getSharesByUser(userId),
    enabled: !!userId,
  });
};


export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation<Group, AxiosError, { groupId: string; dto: { groupName: string; description?: string } }>({
    mutationFn: (payload) => updateGroup(payload.groupId, payload.dto),
    onSuccess: (data) => {
      // Cập nhật lại thông tin nhóm trong cache
      queryClient.invalidateQueries({ queryKey: ['group', data.id] });
      queryClient.invalidateQueries({ queryKey: ['groups'] }); // Cập nhật danh sách nhóm
      Alert.alert('Thành công', 'Đã cập nhật thông tin nhóm.');
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err.response?.data?.message || err.message);
    }
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, string>({
    mutationFn: (groupId) => deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};

// --- Notification Hooks ---
export const useGetNotifications = () => {
  return useQuery<Notification[], AxiosError>({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
    refetchInterval: 30000, // Tự động refresh mỗi 30s
  });
};

export const useGetUnreadCount = () => {
  return useQuery<number, AxiosError>({
    queryKey: ['notifications', 'unread'],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, string>({
    mutationFn: (id) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError>({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });
};

export const useGetAllDebtsByUser = (userId: string) => {
  return useQuery<Debt[], AxiosError>({
    queryKey: ['debts', 'all', userId],
    queryFn: () => getAllDebtsByUser(userId),
    enabled: !!userId,
  });
};

// 👇 THÊM MỚI: Hook xác nhận trả nợ
export const useSettleDebt = () => {
  const queryClient = useQueryClient();
  return useMutation<Debt, AxiosError, string>({
    mutationFn: (debtId) => markDebtAsSettled(debtId),
    onSuccess: (data) => {
      // Làm mới danh sách nợ sau khi update thành công
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] }); 
    },
  });
};

export const useSettleBatchDebts = () => {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, string[]>({
    mutationFn: (debtIds) => settleBatchDebts(debtIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

// ========== HOOKS CHO TÍNH NĂNG XÁC NHẬN THANH TOÁN ==========

/**
 * Hook để người nợ yêu cầu thanh toán
 * - Gửi thông báo cho chủ nợ
 * - Trả về VietQR để chuyển tiền
 */
export const useRequestPayment = () => {
  const queryClient = useQueryClient();
  return useMutation<VietQrDTO, AxiosError, string>({
    mutationFn: (debtId) => requestPayment(debtId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });
};

/**
 * Hook để chủ nợ xác nhận đã nhận tiền
 * - Chuyển trạng thái sang SETTLED
 */
export const useConfirmPayment = () => {
  const queryClient = useQueryClient();
  return useMutation<Debt, AxiosError, string>({
    mutationFn: (debtId) => confirmPayment(debtId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

/**
 * Hook để chủ nợ từ chối (chưa nhận được tiền)
 * - Chuyển trạng thái về UNSETTLED
 */
export const useRejectPayment = () => {
  const queryClient = useQueryClient();
  return useMutation<Debt, AxiosError, string>({
    mutationFn: (debtId) => rejectPayment(debtId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};