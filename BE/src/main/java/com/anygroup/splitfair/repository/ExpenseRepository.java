package com.anygroup.splitfair.repository;

import com.anygroup.splitfair.dto.PaymentStatDTO;
import com.anygroup.splitfair.model.Bill;
import com.anygroup.splitfair.model.Expense;
import com.anygroup.splitfair.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    // Lấy các expense theo bill
    List<Expense> findByBill(Bill bill);

    // Lấy các expense mà user đã tạo
    List<Expense> findByCreatedBy(User user);

    // Lấy các expense mà user đã thanh toán
    List<Expense> findByPaidBy(User paidBy);

    // Thống kê tổng số tiền mỗi user  trong một group (ĐÃ ÁP DỤNG BỘ LỌC ẨN PAYMENT)
    @Query("SELECT new com.anygroup.splitfair.dto.PaymentStatDTO(e.paidBy.userName, SUM(e.amount)) " +
           "FROM Expense e " +
           "WHERE e.bill.group.id = :groupId " +
           "AND (e.bill.isPayment IS NULL OR e.bill.isPayment = false) " +
           "GROUP BY e.paidBy.userName")
    List<PaymentStatDTO> getPaymentStatsByGroup(UUID groupId);

    List<Expense> findByBill_Group_Id(UUID groupId);

    void deleteByBill_Id(UUID billId);
}