package com.anygroup.splitfair.repository;

import com.anygroup.splitfair.enums.DebtStatus;
import com.anygroup.splitfair.model.Debt;
import com.anygroup.splitfair.model.Expense;
import com.anygroup.splitfair.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DebtRepository extends JpaRepository<Debt, UUID> {

    // Tìm các khoản nợ mà user này nợ người khác
    List<Debt> findByAmountFrom(User fromUser);

    // Tìm các khoản nợ mà người khác nợ user này
    List<Debt> findByAmountTo(User toUser);

    Optional<Debt> findByExpenseAndAmountFromAndAmountTo(Expense expense, User from, User to);
    Optional<Debt> findByAmountFromAndAmountTo(User from, User to);
    List<Debt> findByExpenseAndAmountFrom(Expense expense, User amountFrom);


    List<Debt> findByExpense_Bill_Group_IdAndStatus(UUID groupId, DebtStatus status);

    // Xóa các khoản nợ liên quan đến một expense cụ thể
    void deleteByExpense_Id(UUID expenseId);
    @Query("SELECT d FROM Debt d WHERE d.amountFrom = :fromUser AND d.amountTo = :toUser " +
           "AND d.expense.bill.group.id = :groupId AND d.status = 'UNSETTLED' " +
           "ORDER BY d.expense.createdTime ASC")
    List<Debt> findUnsettledDebts(
            @Param("fromUser") User fromUser, 
            @Param("toUser") User toUser, 
            @Param("groupId") UUID groupId
    );
}