// src/types/bill.types.ts
export type BillStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Bill {
  id: string;
  groupId: string;
  categoryId: string;
  description: string;
  totalAmount: number; // BigDecimal
  currency: string;
  status: BillStatus;
  createdTime: string; // Instant
  createdBy: string;
  isPayment?: boolean;
}

export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedTo: string[]; // List of user IDs
}