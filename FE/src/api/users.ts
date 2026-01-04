import axios from '@/utils/axios.customize';
import { User } from '@/types/user.types';

export const searchUsers = (query: string): Promise<User[]> => {
  return axios.get(`/api/users/search?query=${query}`);
};

export const getAllUsers = (): Promise<User[]> => {
  return axios.get('/api/users');
};

export const updateUser = (userId: string, dto: Partial<User>): Promise<User> => {
  return axios.put(`/api/users/${userId}`, dto);
};

// Cập nhật thông tin ngân hàng
export interface BankInfoRequest {
  bankCode: string;
  bankAccountNo: string;
  bankAccountName: string;
}

export const updateMyBankInfo = (request: BankInfoRequest): Promise<void> => {
  return axios.post('/api/users/me/bank-info', request);
};


export const uploadAvatarAPI = async (userId: string, formData: FormData): Promise<User> => {
  const response = await axios.post(`/api/users/${userId}/avatar`, formData, {
    headers: {
      // 👇 SỬA QUAN TRỌNG:
      // Đặt Content-Type là "undefined" để trình duyệt tự động nhận diện FormData 
      // và thêm boundary (ví dụ: multipart/form-data; boundary=---WebKitFormBoundary...)
      'Content-Type': undefined as unknown as string, 
    },
    // 👇 Giữ nguyên dòng này để Axios không tự động chuyển FormData thành JSON
    transformRequest: (data) => data,
  });
  
  return response as unknown as User; 
};