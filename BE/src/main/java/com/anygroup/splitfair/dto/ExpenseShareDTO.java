package com.anygroup.splitfair.dto;

import com.anygroup.splitfair.enums.ShareStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ExpenseShareDTO {
    private UUID id;
    private UUID expenseId;
    private UUID userId;
    private BigDecimal percentage;
    private BigDecimal shareAmount;
    private ShareStatus status; // PAID / UNPAID
}