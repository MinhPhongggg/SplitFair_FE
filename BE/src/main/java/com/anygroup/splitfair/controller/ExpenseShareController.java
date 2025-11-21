package com.anygroup.splitfair.controller;

import com.anygroup.splitfair.dto.ExpenseShareDTO;
import com.anygroup.splitfair.dto.ExpenseShareSaveRequest;
import com.anygroup.splitfair.service.ExpenseShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/expense-shares")
@RequiredArgsConstructor
public class ExpenseShareController {

    private final ExpenseShareService expenseShareService;


    @PostMapping
    public ResponseEntity<ExpenseShareDTO> createShare(@RequestBody ExpenseShareDTO dto) {
        ExpenseShareDTO created = expenseShareService.createShare(dto);
        return ResponseEntity.ok(created);
    }


    @PatchMapping("/{id}/status")
    public ResponseEntity<ExpenseShareDTO> updateShareStatus(
            @PathVariable UUID id,
            @RequestParam("status") String status
    ) {
        ExpenseShareDTO updated = expenseShareService.updateShareStatus(id, status);
        return ResponseEntity.ok(updated);
    }


    @GetMapping("/expense/{expenseId}")
    public ResponseEntity<List<ExpenseShareDTO>> getSharesByExpense(@PathVariable UUID expenseId) {
        List<ExpenseShareDTO> shares = expenseShareService.getSharesByExpense(expenseId);
        return ResponseEntity.ok(shares);
    }


    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ExpenseShareDTO>> getSharesByUser(@PathVariable UUID userId) {
        List<ExpenseShareDTO> shares = expenseShareService.getSharesByUser(userId);
        return ResponseEntity.ok(shares);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShare(@PathVariable UUID id) {
        expenseShareService.deleteShare(id);
        return ResponseEntity.noContent().build();
    }


    @PostMapping("/save")
    public ResponseEntity<?> saveExpenseShares(@RequestBody ExpenseShareSaveRequest request) {
        expenseShareService.saveExpenseShares(request);
        return ResponseEntity.ok(Map.of("message", "Expense shares saved successfully"));
    }
}
