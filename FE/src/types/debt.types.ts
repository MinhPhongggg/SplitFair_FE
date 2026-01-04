// src/types/debt.types.ts
export type DebtStatus = 'UNSETTLED' | 'PENDING_CONFIRMATION' | 'SETTLED';

export interface Debt {
  id: string;
  expenseId: string;
  fromUserId: string; // Người nợ
  toUserId: string;   // Người được trả
  amount: number;
  status: DebtStatus;
  groupName?: string;
  fromUserName?: string;
  fromUserAvatar?: string;
  toUserName?: string;
  toUserAvatar?: string;

  expenseDescription?: string;
  createdTime?: string;
}

// VietQR response khi yêu cầu thanh toán
export interface VietQrDTO {
  bankCode: string;
  accountNo: string;
  accountName: string;
  amount: number;
  content: string;
  qrContent: string;
  qrUrl: string;
}