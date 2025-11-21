package com.anygroup.splitfair.model;

import com.anygroup.splitfair.enums.ShareStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "expense_share")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseShare {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "expense_id")
    private Expense expense;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private BigDecimal percentage;
    
    @Column(precision = 19, scale = 4)
    private BigDecimal shareAmount;

    @Enumerated(EnumType.STRING)
    private ShareStatus status;

    @PrePersist
    public void prePersist() {
        if (status == null) {
            status = ShareStatus.UNPAID;
        }
    }
}