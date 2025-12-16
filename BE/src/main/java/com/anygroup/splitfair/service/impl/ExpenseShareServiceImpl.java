    package com.anygroup.splitfair.service.impl;

    import com.anygroup.splitfair.dto.ExpenseShareDTO;
    import com.anygroup.splitfair.dto.ExpenseShareSaveRequest;
    import com.anygroup.splitfair.enums.DebtStatus;
    import com.anygroup.splitfair.enums.NotificationType;
    import com.anygroup.splitfair.enums.ShareStatus;
    import com.anygroup.splitfair.mapper.ExpenseShareMapper;
    import com.anygroup.splitfair.model.*;
    import com.anygroup.splitfair.repository.*;
    import com.anygroup.splitfair.service.ExpenseShareService;
    import com.anygroup.splitfair.service.NotificationService;
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
        private final NotificationService notificationService; // Inject NotificationService


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

            // 1. Xóa dữ liệu cũ (Shares & Debts) để tránh trùng lặp
            expense.getShares().clear();
            expense.getDebts().clear();

            for (ExpenseShareSaveRequest.ShareInput input : request.getShares()) {
                User user = userRepository.findById(input.getUserId())
                        .orElseThrow(() -> new RuntimeException("User not found with id: " + input.getUserId()));

                // 2. Tạo Share mới
                ExpenseShare share = new ExpenseShare();
                share.setExpense(expense);
                share.setUser(user);
                
                BigDecimal shareAmount = input.getShareAmount();
                BigDecimal totalAmount = request.getTotalAmount();
                
                BigDecimal percentage;
                if (totalAmount.compareTo(BigDecimal.ZERO) == 0) {
                    percentage = BigDecimal.ZERO;
                } else {
                    percentage = shareAmount.multiply(BigDecimal.valueOf(100))
                                            .divide(totalAmount, 2, RoundingMode.HALF_UP);
                }
                
                share.setPercentage(percentage);
                share.setShareAmount(shareAmount);
                share.setStatus(ShareStatus.UNPAID);
                
                // Thêm vào list của Expense (thay vì save trực tiếp)
                expense.getShares().add(share);
                
                // 3. Tạo Debt mới
                if (!user.getId().equals(expense.getPaidBy().getId())) {
                    Debt debt = new Debt();
                    debt.setExpense(expense);
                    debt.setAmountFrom(user);
                    debt.setAmountTo(expense.getPaidBy());
                    debt.setAmount(input.getShareAmount());
                    debt.setStatus(DebtStatus.UNSETTLED);
                    
                    // Thêm vào list của Expense
                    expense.getDebts().add(debt);

                    // Lấy tên nhóm
                    String groupName = "";
                    if (expense.getBill() != null && expense.getBill().getGroup() != null) {
                        groupName = " trong " + expense.getBill().getGroup().getGroupName();
                    }

                    // Gửi thông báo cho người nợ
                    notificationService.createNotification(
                            user.getId(),
                            "Chi tiêu mới",
                            "Bạn đã được chia " + input.getShareAmount() + "đ" + groupName,
                            NotificationType.EXPENSE_ADDED,
                            expense.getId().toString()
                    );
                }
            }
            
            // 4. Lưu Expense (Cascade sẽ lưu Shares và Debts mới, đồng thời xóa cái cũ do orphanRemoval=true)
            expenseRepository.save(expense);
            
            // 5. TỰ ĐỘNG DỌN DẸP NỢ (AUTO SETTLE)
        try {
            // A. Kiểm tra xem đây có phải là giao dịch thanh toán không
            String desc = expense.getDescription() != null ? expense.getDescription().toLowerCase() : "";
            boolean isPayment = desc.contains("thanh toán") || desc.contains("trả nợ") || desc.contains("payment") 
                                || desc.contains("trả tiền") || desc.contains("settle");

            // Kiểm tra thêm Category nếu cần
            if (!isPayment && expense.getBill() != null && expense.getBill().getCategory() != null) {
                String catName = expense.getBill().getCategory().getCategoryName().toLowerCase();
                isPayment = catName.contains("thanh toán") || catName.contains("trả nợ");
            }

            // B. Nếu đúng là Thanh toán, tiến hành cấn trừ
            if (isPayment && expense.getBill() != null && expense.getBill().getGroup() != null) {
                User payer = expense.getPaidBy(); // Người trả tiền (A - Người nợ cũ)
                UUID groupId = expense.getBill().getGroup().getId();

                // Duyệt qua danh sách người nhận tiền (B - Chủ nợ)
                for (ExpenseShareSaveRequest.ShareInput input : request.getShares()) {
                    UUID payeeId = input.getUserId();
                    
                    if (payeeId != null && !payeeId.equals(payer.getId())) {
                        User payee = userRepository.findById(payeeId).orElse(null);
                        
                        if (payee != null) {
                            // 1. Tìm các khoản nợ cũ: Payer nợ Payee
                            List<Debt> oldDebts = debtRepository.findUnsettledDebts(payer, payee, groupId);
                            
                            // 2. Tìm khoản nợ mới vừa sinh ra từ expense này: Payee nợ Payer
                            // (Hệ thống hiểu A trả tiền cho B thì B nợ A, cần mark SETTLED để triệt tiêu)
                            List<Debt> newDebts = debtRepository.findByExpenseAndAmountFrom(expense, payee);

                            BigDecimal amountToSettle = input.getShareAmount(); // Số tiền A trả
                            BigDecimal settledTotal = BigDecimal.ZERO;
                            
                            List<Debt> oldDebtsToSave = new java.util.ArrayList<>();

                            // 3. Trừ dần vào các khoản nợ cũ (FIFO)
                            for (Debt oldDebt : oldDebts) {
                                if (amountToSettle.compareTo(BigDecimal.ZERO) <= 0) break;

                                // Nếu tiền trả >= khoản nợ cũ -> Mark SETTLED khoản cũ
                                if (amountToSettle.compareTo(oldDebt.getAmount()) >= 0) {
                                    oldDebt.setStatus(DebtStatus.SETTLED);
                                    oldDebtsToSave.add(oldDebt);
                                    
                                    amountToSettle = amountToSettle.subtract(oldDebt.getAmount());
                                    settledTotal = settledTotal.add(oldDebt.getAmount());
                                }
                            }

                            // 4. Quan trọng: Chỉ lưu nếu số tiền khớp hoàn toàn hoặc gần đúng
                            // (Ở đây ta check khớp hoàn toàn để an toàn nhất)
                            BigDecimal newDebtAmount = input.getShareAmount();
                            
                            if (settledTotal.compareTo(newDebtAmount) == 0) {
                                // Lưu trạng thái SETTLED cho nợ cũ
                                debtRepository.saveAll(oldDebtsToSave);
                                
                                // Lưu trạng thái SETTLED cho khoản thanh toán mới
                                for (Debt newDebt : newDebts) {
                                    newDebt.setStatus(DebtStatus.SETTLED);
                                    debtRepository.save(newDebt);
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace(); // Log lỗi nhưng không chặn transaction chính
        }

        }
    }
