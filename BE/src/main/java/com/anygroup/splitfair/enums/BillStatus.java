package com.anygroup.splitfair.enums;

public enum BillStatus {
    DRAFT,       // Mới tạo, chưa có expense
    ACTIVE,      // Đang dùng, có expense
    COMPLETED,   // Đã hoàn thành (đã thanh toán hết)
    CANCELLED    // Bị hủy
}
