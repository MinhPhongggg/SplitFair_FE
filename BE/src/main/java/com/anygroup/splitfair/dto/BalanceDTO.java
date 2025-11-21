package com.anygroup.splitfair.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
public class BalanceDTO {
    private UUID userId;
    private String userName;
    private BigDecimal netAmount; // Số âm là nợ, số dương là được trả
}