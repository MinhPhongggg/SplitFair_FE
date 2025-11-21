package com.anygroup.splitfair.model;

import com.anygroup.splitfair.enums.DebtStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "debt")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Debt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "expense_id")
    private Expense expense;

    @ManyToOne
    @JoinColumn(name = "amount_from")
    private User amountFrom;

    @ManyToOne
    @JoinColumn(name = "amount_to")
    private User amountTo;

    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private DebtStatus status = DebtStatus.UNSETTLED;
}