export type NotificationType = 
  | 'GROUP_INVITE' 
  | 'EXPENSE_ADDED' 
  | 'DEBT_SETTLED' 
  | 'DEBT_REMINDER' 
  | 'DEBT_PAYMENT_REQUEST'   // Yêu cầu xác nhận thanh toán
  | 'DEBT_PAYMENT_REJECTED'  // Từ chối thanh toán
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  referenceId?: string;
  isRead: boolean;
  createdTime: string;
}
