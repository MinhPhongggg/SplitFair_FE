// src/types/user.types.ts
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export interface User {
  id: string; // UUID -> string
  name: string;
  email: string;
  status: UserStatus;
  roleId: string; // UUID -> string
  avatar?: string; // Match backend DTO 'avatar'
  
  // Thông tin ngân hàng
  bankCode?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
}

// Danh sách ngân hàng phổ biến
export const BANK_LIST = [
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'MB', name: 'MB Bank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'VTB', name: 'Vietinbank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'OCB', name: 'OCB' },
  { code: 'MSB', name: 'MSB' },
  { code: 'SHB', name: 'SHB' },
  { code: 'EIB', name: 'Eximbank' },
  { code: 'LPB', name: 'LienVietPostBank' },
  { code: 'VAB', name: 'VietABank' },
  { code: 'NAB', name: 'Nam A Bank' },
  { code: 'VIB', name: 'VIB' },
  { code: 'CAKE', name: 'CAKE by VPBank' },
  { code: 'Ubank', name: 'Ubank by VPBank' },
];