package com.anygroup.splitfair.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseShareSaveRequest {
    private UUID expenseId;
    private BigDecimal totalAmount;
    private String currency;
    private UUID paidBy;
    private List<ShareInput> shares;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ShareInput {
        private UUID userId;
        private Integer portion;
        private BigDecimal percentage;
        private BigDecimal shareAmount;
    }
}
