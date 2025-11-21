package com.anygroup.splitfair.dto;

import com.anygroup.splitfair.enums.DebtStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class DebtDTO {
    private UUID id;
    private UUID expenseId;
    private UUID fromUserId; // người nợ
    private UUID toUserId;   // người được trả
    private BigDecimal amount;
    private DebtStatus status;
}