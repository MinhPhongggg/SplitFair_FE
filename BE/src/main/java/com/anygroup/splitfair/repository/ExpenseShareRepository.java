package com.anygroup.splitfair.repository;

import com.anygroup.splitfair.model.Expense;
import com.anygroup.splitfair.model.ExpenseShare;
import com.anygroup.splitfair.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpenseShareRepository extends JpaRepository<ExpenseShare, UUID> {

    // Tìm tất cả share của 1 expense
    List<ExpenseShare> findByExpense(Expense expense);

    // Tìm tất cả share của 1 user
    List<ExpenseShare> findByUser(User user);

    // Kiểm tra 1 user đã có share trong expense chưa
    Optional<ExpenseShare> findByExpenseAndUser(Expense expense, User user);
    List<ExpenseShare> findByExpense_Bill_Group_Id(UUID groupId);
}