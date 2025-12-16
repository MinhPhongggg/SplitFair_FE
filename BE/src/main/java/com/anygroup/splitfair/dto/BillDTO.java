package com.anygroup.splitfair.dto;

import com.anygroup.splitfair.enums.BillStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
public class BillDTO {
    private UUID id;
    private UUID groupId;
    private UUID categoryId;
    private String description;
    private BigDecimal totalAmount;
    private String currency;
    private BillStatus status;

    private Instant createdTime;
    private UUID createdBy;
    private Boolean isPayment;
}