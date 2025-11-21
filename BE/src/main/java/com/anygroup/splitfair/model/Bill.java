package com.anygroup.splitfair.model;

import com.anygroup.splitfair.enums.BillStatus;
import com.anygroup.splitfair.enums.CurrencyType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bill")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "group_id")
    private Group group;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    private String description;

    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CurrencyType currency = CurrencyType.VND;

    // ✅ PHẢI THÊM @Builder.Default để giữ giá trị mặc định
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BillStatus status = BillStatus.DRAFT;

    @Builder.Default
    private Instant createdTime = Instant.now();

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @PrePersist
    public void prePersist() {
        if (createdTime == null) createdTime = Instant.now();
        if (status == null) status = BillStatus.DRAFT;
    }
}
