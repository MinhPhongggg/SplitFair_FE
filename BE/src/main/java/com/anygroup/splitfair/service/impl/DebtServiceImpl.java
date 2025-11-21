package com.anygroup.splitfair.service.impl;

import com.anygroup.splitfair.dto.BalanceDTO;
import com.anygroup.splitfair.dto.DebtDTO;
import com.anygroup.splitfair.enums.DebtStatus;
import com.anygroup.splitfair.mapper.DebtMapper;
import com.anygroup.splitfair.model.*;
import com.anygroup.splitfair.repository.*;
import com.anygroup.splitfair.service.DebtService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DebtServiceImpl implements DebtService {

    private final DebtRepository debtRepository;
    private final DebtMapper debtMapper;
    private final ExpenseShareRepository expenseShareRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;


    @Override
    public List<DebtDTO> getAllDebts() {
        return debtRepository.findAll()
                .stream()
                .map(debtMapper::toDTO)
                .collect(Collectors.toList());
    }

    //  nợ theo ID
    @Override
    public DebtDTO getDebtById(UUID id) {
        Debt debt = debtRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Debt not found with id: " + id));
        return debtMapper.toDTO(debt);
    }

    // Tạo nợ thủ công (hiếm khi dùng)
    @Override
    public DebtDTO createDebt(DebtDTO dto) {
        Debt debt = debtMapper.toEntity(dto);
        debt.setStatus(DebtStatus.UNSETTLED);
        debt = debtRepository.save(debt);
        return debtMapper.toDTO(debt);
    }


    @Override
    public DebtDTO updateDebt(DebtDTO dto) {
        if (dto.getId() == null) throw new RuntimeException("Debt ID is required for update");

        Debt existing = debtRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Debt not found with id: " + dto.getId()));

        Debt updated = debtMapper.toEntity(dto);
        updated.setId(existing.getId());

        updated = debtRepository.save(updated);
        return debtMapper.toDTO(updated);
    }


    @Override
    public void deleteDebt(UUID id) {
        debtRepository.deleteById(id);
    }

    //Đánh dấu nợ đã được thanh toán
    @Override
    public DebtDTO markAsSettled(UUID id) {
        Debt debt = debtRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Debt not found with id: " + id));
        debt.setStatus(DebtStatus.SETTLED);
        debtRepository.save(debt);
        return debtMapper.toDTO(debt);
    }

    // Tính toán nợ khi có Expense mới
    @Override
    public void calculateDebtsForExpense(Expense expense) {
        List<ExpenseShare> shares = expenseShareRepository.findByExpense(expense);
        User payer = expense.getPaidBy();

        for (ExpenseShare share : shares) {
            User debtor = share.getUser();
            if (debtor.getId().equals(payer.getId())) continue; // Người trả không nợ chính mình

            // Tính số tiền nợ theo phần trăm chia
            BigDecimal amount = expense.getAmount()
                    .multiply(share.getPercentage().divide(BigDecimal.valueOf(100)));

            // Kiểm tra nếu đã có nợ giữa hai người
            Optional<Debt> existing = debtRepository.findByAmountFromAndAmountTo(debtor, payer);
            if (existing.isPresent()) {
                Debt debt = existing.get();
                debt.setAmount(debt.getAmount().add(amount)); // cộng dồn
                debtRepository.save(debt);
            } else {
                Debt newDebt = Debt.builder()
                        .expense(expense)
                        .amountFrom(debtor)
                        .amountTo(payer)
                        .amount(amount)
                        .status(DebtStatus.UNSETTLED)
                        .build();
                debtRepository.save(newDebt);
            }
        }
    }

    // Lấy tổng kết số dư nợ của tất cả người dùng
    @Override
    public Map<UUID, BigDecimal> getNetBalances() {
        List<Debt> debts = debtRepository.findAll();
        Map<UUID, BigDecimal> balance = new HashMap<>();

        for (Debt d : debts) {
            UUID from = d.getAmountFrom().getId();
            UUID to = d.getAmountTo().getId();
            BigDecimal amount = d.getAmount();

            balance.put(from, balance.getOrDefault(from, BigDecimal.ZERO).subtract(amount));
            balance.put(to, balance.getOrDefault(to, BigDecimal.ZERO).add(amount));
        }

        return balance;
    }

    //Trả về dạng danh sách dễ đọc
    @Override
    public List<String> getReadableBalances() {
        Map<UUID, BigDecimal> balances = getNetBalances();

        List<String> readable = new ArrayList<>();

        for (Map.Entry<UUID, BigDecimal> entry : balances.entrySet()) {
            UUID userId = entry.getKey();
            BigDecimal amount = entry.getValue();

            // ✅ Lấy tên người dùng đúng cách
            String userName = userRepository.findById(userId)
                    .map(User::getUserName)
                    .orElse("Unknown User");

            // ✅ Định dạng kết quả hiển thị
            if (amount.compareTo(BigDecimal.ZERO) < 0) {
                readable.add(userName + " owes " + amount.abs() + " VND");
            } else if (amount.compareTo(BigDecimal.ZERO) > 0) {
                readable.add(userName + " should receive " + amount + " VND");
            } else {
                readable.add(userName + " is settled up");
            }
        }

        return readable;
    }

    // Lấy danh sách nợ theo người dùng
    @Override
    public List<DebtDTO> getDebtsByUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        List<Debt> debts = debtRepository.findByAmountFrom(user);
        debts.addAll(debtRepository.findByAmountTo(user));

        return debts.stream().map(debtMapper::toDTO).collect(Collectors.toList());
    }

    //// HÀM MỚI (Helper):
    @Override
    public List<BalanceDTO> getNetBalancesByGroup(UUID groupId) {
        
        // Lấy TẤT CẢ các bản ghi chia tiền (shares) trong nhóm
        List<ExpenseShare> allSharesInGroup = expenseShareRepository.findByExpense_Bill_Group_Id(groupId);
        
        // Lấy TẤT CẢ các thành viên trong nhóm (từ các bản ghi shares)
        Set<User> membersInGroup = allSharesInGroup.stream()
                                    .map(ExpenseShare::getUser)
                                    .collect(Collectors.toSet());
        
        if (membersInGroup.isEmpty()) {
            return new ArrayList<>(); // Không có ai trong nhóm
        }
        
        int memberCount = membersInGroup.size();
        
        // Map để lưu tổng số tiền mỗi người "lẽ ra phải trả"
        Map<UUID, BigDecimal> totalOwedMap = new HashMap<>();
        
        // Map để lưu tổng số tiền mỗi người "đã thực sự trả"
        Map<UUID, BigDecimal> totalPaidMap = new HashMap<>();

        // Khởi tạo map
        for (User user : membersInGroup) {
            totalOwedMap.put(user.getId(), BigDecimal.ZERO);
            totalPaidMap.put(user.getId(), BigDecimal.ZERO);
        }

        // --- TÍNH TOÁN LẠI TỪ ĐẦU ---

        // 1. Tính tổng số tiền MỖI NGƯỜI ĐÃ TRẢ (giống logic biểu đồ tròn)
        List<Expense> allExpensesInGroup = expenseRepository.findByBill_Group_Id(groupId);
        for (Expense expense : allExpensesInGroup) {
            UUID paidById = expense.getPaidBy().getId();
            totalPaidMap.put(paidById, totalPaidMap.get(paidById).add(expense.getAmount()));
        }

        // 2. Tính tổng số tiền MỖI NGƯỜI LẼ RA PHẢI TRẢ (đọc từ shareAmount)
        for (ExpenseShare share : allSharesInGroup) {
            UUID userId = share.getUser().getId();
            BigDecimal shareAmount = share.getShareAmount();
            
            // (Dự phòng nếu shareAmount bị null do dữ liệu cũ)
            if (shareAmount == null) {
                shareAmount = share.getExpense().getAmount()
                                .multiply(share.getPercentage())
                                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }
            
            totalOwedMap.put(userId, totalOwedMap.get(userId).add(shareAmount));
        }

        // 3. Tính số dư (Công nợ)
        // Net Balance = (Tổng Đã Trả) - (Tổng Lẽ Ra Phải Trả)
        return membersInGroup.stream()
                .map(user -> {
                    BigDecimal totalPaid = totalPaidMap.get(user.getId());
                    BigDecimal totalOwed = totalOwedMap.get(user.getId());
                    BigDecimal netBalance = totalPaid.subtract(totalOwed);
                    
                    return new BalanceDTO(
                            user.getId(),
                            user.getUserName(),
                            netBalance // Số âm (nợ), số dương (được trả)
                    );
                })
                .collect(Collectors.toList());
    }
}
