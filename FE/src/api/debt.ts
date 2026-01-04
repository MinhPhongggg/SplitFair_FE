// src/api/debt.ts
import { Debt, VietQrDTO } from '@/types/debt.types';
import axios from '@/utils/axios.customize';

export const getReadableBalances = (): Promise<string[]> => {
  return axios.get('/api/debts/balances/readable');
};
export const getAllDebtsByUser = (userId: string): Promise<Debt[]> => {
  return axios.get(`/api/debts/user/${userId}`);
};

// 👇 THÊM MỚI: Đánh dấu đã trả nợ (Settle)
export const markDebtAsSettled = (debtId: string): Promise<Debt> => {
  return axios.patch(`/api/debts/${debtId}/settle`);
};

export const settleBatchDebts = (debtIds: string[]): Promise<void> => {
  return axios.post('/api/debts/settle-batch', debtIds);
};

// ========== TÍNH NĂNG XÁC NHẬN THANH TOÁN ==========

/**
 * Người nợ yêu cầu thanh toán
 * - Chuyển status từ UNSETTLED -> PENDING_CONFIRMATION
 * - Gửi thông báo cho chủ nợ
 * - Trả về VietQR để chuyển tiền
 */
export const requestPayment = (debtId: string): Promise<VietQrDTO> => {
  return axios.post(`/api/debts/${debtId}/pay`);
};

/**
 * Chủ nợ xác nhận đã nhận tiền
 * - Chuyển status từ PENDING_CONFIRMATION -> SETTLED
 */
export const confirmPayment = (debtId: string): Promise<Debt> => {
  return axios.post(`/api/debts/${debtId}/confirm`);
};

/**
 * Chủ nợ từ chối (chưa nhận được tiền)
 * - Chuyển status từ PENDING_CONFIRMATION -> UNSETTLED
 * - Gửi thông báo cho người nợ
 */
export const rejectPayment = (debtId: string): Promise<Debt> => {
  return axios.post(`/api/debts/${debtId}/reject`);
};