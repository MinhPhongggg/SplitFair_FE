package com.anygroup.splitfair.controller;

import com.anygroup.splitfair.dto.ExpenseDTO;
import com.anygroup.splitfair.dto.PaymentStatDTO;
import com.anygroup.splitfair.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;


    @PostMapping
    public ResponseEntity<ExpenseDTO> createExpense(@RequestBody ExpenseDTO dto) {
        ExpenseDTO created = expenseService.createExpense(dto);
        return ResponseEntity.ok(created);
    }


    @GetMapping
    public ResponseEntity<List<ExpenseDTO>> getAllExpenses() {
        return ResponseEntity.ok(expenseService.getAllExpenses());
    }


    @GetMapping("/{id}")
    public ResponseEntity<ExpenseDTO> getExpenseById(@PathVariable UUID id) {
        return ResponseEntity.ok(expenseService.getExpenseById(id));
    }


    @GetMapping("/bill/{billId}")
    public ResponseEntity<List<ExpenseDTO>> getExpensesByBill(@PathVariable UUID billId) {
        return ResponseEntity.ok(expenseService.getExpensesByBill(billId));
    }


    @GetMapping("/created-by/{userId}")
    public ResponseEntity<List<ExpenseDTO>> getExpensesCreatedByUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(expenseService.getExpensesCreatedByUser(userId));
    }


    @GetMapping("/paid-by/{userId}")
    public ResponseEntity<List<ExpenseDTO>> getExpensesPaidByUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(expenseService.getExpensesPaidByUser(userId));
    }


    @PutMapping("/{id}")
    public ResponseEntity<ExpenseDTO> updateExpense(@PathVariable UUID id, @RequestBody ExpenseDTO dto) {
        ExpenseDTO updated = expenseService.updateExpense(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable UUID id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/group/{groupId}/stats")
    public ResponseEntity<List<PaymentStatDTO>> getPaymentStatsByGroup(@PathVariable UUID groupId) {
        return ResponseEntity.ok(expenseService.getPaymentStatsByGroup(groupId));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<ExpenseDTO>> getExpensesByGroup(@PathVariable UUID groupId) {
        return ResponseEntity.ok(expenseService.getExpensesByGroup(groupId));
    }
}
