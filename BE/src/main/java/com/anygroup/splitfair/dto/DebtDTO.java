package com.anygroup.splitfair.dto;

import com.anygroup.splitfair.enums.DebtStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
public class DebtDTO {
    private UUID id;
    private UUID expenseId;   //thêm
    private UUID fromUserId; // người nợ
    private UUID toUserId;   // người được trả
    private BigDecimal amount;
    private DebtStatus status;
    private String groupName;
    //thêm
    // Thông tin người dùng để hiển thị
    private String fromUserName;
    private String fromUserAvatar;
    private String toUserName;
    private String toUserAvatar;

    private String expenseDescription; // Tên khoản chi tiêu (vd: Ăn sáng)
    private Instant createdTime;       // Thời gian tạo
}