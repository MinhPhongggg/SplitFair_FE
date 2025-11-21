package com.anygroup.splitfair.service;

import com.anygroup.splitfair.dto.ExpenseShareDTO;
import com.anygroup.splitfair.dto.ExpenseShareSaveRequest;
import java.util.List;
import java.util.UUID;

public interface ExpenseShareService {

    // Tạo phần chia riêng lẻ
    ExpenseShareDTO createShare(ExpenseShareDTO dto);

    //  Cập nhật trạng thái (PAID / UNPAID)
    ExpenseShareDTO updateShareStatus(UUID id, String status);

    //  Lấy danh sách share theo expense
    List<ExpenseShareDTO> getSharesByExpense(UUID expenseId);

    //  Lấy danh sách share theo user
    List<ExpenseShareDTO> getSharesByUser(UUID userId);

    // Xóa share
    void deleteShare(UUID id);

    //  Lưu danh sách chia từ frontend (frontend đã chia sẵn)
    void saveExpenseShares(ExpenseShareSaveRequest request);
}
