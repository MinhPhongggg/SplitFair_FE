package com.anygroup.splitfair.service.impl;

import com.anygroup.splitfair.dto.ExpenseShareDTO;
import com.anygroup.splitfair.dto.ExpenseShareSaveRequest;
import com.anygroup.splitfair.enums.DebtStatus;
import com.anygroup.splitfair.enums.ShareStatus;
import com.anygroup.splitfair.mapper.ExpenseShareMapper;
import com.anygroup.splitfair.model.*;
import com.anygroup.splitfair.repository.*;
import com.anygroup.splitfair.service.ExpenseShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ExpenseShareServiceImpl implements ExpenseShareService {

    private final ExpenseShareRepository expenseShareRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final DebtRepository debtRepository;
    private final ExpenseShareMapper expenseShareMapper;


    //Tạo phần chia chi phí riêng lẻ
    @Override
    public ExpenseShareDTO createShare(ExpenseShareDTO dto) {
        Expense expense = expenseRepository.findById(dto.getExpenseId())
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + dto.getExpenseId()));

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + dto.getUserId()));

        ExpenseShare share = new ExpenseShare();
        share.setExpense(expense);
        share.setUser(user);
        share.setPercentage(dto.getPercentage());
        share.setStatus(dto.getStatus() == null ? ShareStatus.UNPAID : dto.getStatus());

        share = expenseShareRepository.save(share);

        BigDecimal shareAmount = expense.getAmount()
                .multiply(share.getPercentage())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        Debt debt = new Debt();
        debt.setExpense(expense);
        debt.setAmountFrom(user);
        debt.setAmountTo(expense.getPaidBy());
        debt.setAmount(shareAmount);
        debt.setStatus(DebtStatus.UNSETTLED);
        debtRepository.save(debt);

        return expenseShareMapper.toDTO(share);
    }


    @Override
    public ExpenseShareDTO updateShareStatus(UUID id, String status) {
        ExpenseShare share = expenseShareRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ExpenseShare not found with id: " + id));

        ShareStatus newStatus = ShareStatus.valueOf(status.toUpperCase());
        share.setStatus(newStatus);
        share = expenseShareRepository.save(share);

        List<Debt> debts = debtRepository.findByExpenseAndAmountFrom(
                share.getExpense(),
                share.getUser()
        );

        for (Debt debt : debts) {
            if (newStatus == ShareStatus.PAID) {
                debt.setStatus(DebtStatus.SETTLED);
            } else {
                debt.setStatus(DebtStatus.UNSETTLED);
            }
            debtRepository.save(debt);
        }

        return expenseShareMapper.toDTO(share);
    }


    @Override
    public List<ExpenseShareDTO> getSharesByExpense(UUID expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + expenseId));

        return expenseShareRepository.findByExpense(expense)
                .stream()
                .map(expenseShareMapper::toDTO)
                .collect(Collectors.toList());
    }


    @Override
    public List<ExpenseShareDTO> getSharesByUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        return expenseShareRepository.findByUser(user)
                .stream()
                .map(expenseShareMapper::toDTO)
                .collect(Collectors.toList());
    }


    @Override
    public void deleteShare(UUID id) {
        ExpenseShare share = expenseShareRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ExpenseShare not found with id: " + id));

        List<Debt> debts = debtRepository.findByExpenseAndAmountFrom(
                share.getExpense(),
                share.getUser()
        );
        debts.forEach(debtRepository::delete);

        expenseShareRepository.delete(share);
    }



    //Lưu danh sách chia từ frontend (frontend đã chia sẵn)
    @Override
    @Transactional
    public void saveExpenseShares(ExpenseShareSaveRequest request) {
        Expense expense = expenseRepository.findById(request.getExpenseId())
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + request.getExpenseId()));

        for (ExpenseShareSaveRequest.ShareInput input : request.getShares()) {
            User user = userRepository.findById(input.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + input.getUserId()));

            ExpenseShare share = new ExpenseShare();
            share.setExpense(expense);
            share.setUser(user);
            
            // --- 👇 SỬA LỖI LOGIC Ở ĐÂY ---
            BigDecimal shareAmount = input.getShareAmount(); // Lấy 200đ
            BigDecimal totalAmount = request.getTotalAmount(); // Lấy 600đ
            
            // Tính toán % (vẫn cần cho Pie Chart, nhưng ta sẽ xử lý làm tròn)
            BigDecimal percentage;
            if (totalAmount.compareTo(BigDecimal.ZERO) == 0) {
                percentage = BigDecimal.ZERO;
            } else {
                percentage = shareAmount.multiply(BigDecimal.valueOf(100))
                                        .divide(totalAmount, 2, RoundingMode.HALF_UP);
            }
            
            share.setPercentage(percentage); // Lưu % (33.33)
            share.setShareAmount(shareAmount); // 👈 LƯU SỐ TIỀN GỐC (200)

            share.setStatus(ShareStatus.UNPAID);
            expenseShareRepository.save(share);
            
            // Logic tạo Debt (đã đúng)
            if (!user.getId().equals(expense.getPaidBy().getId())) {
                Debt debt = new Debt();
                // ...
                debt.setAmount(input.getShareAmount()); // Dùng 200
                // ...
                debtRepository.save(debt);
            }
        }
        // (Xóa logic làm tròn % của người cuối cùng đi, nó không cần thiết nếu ta dùng shareAmount)
    }
}
