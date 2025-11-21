package com.anygroup.splitfair.dto;

import com.anygroup.splitfair.enums.ExpenseStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
public class ExpenseDTO {
    private UUID id;
    private UUID billId;
    private UUID groupId;
    private UUID paidBy;       // Người trả tiền
    private BigDecimal amount;
    private String description;
    private Instant createdTime;
    private UUID createdBy;
    private ExpenseStatus status;
    private UUID userId;
}