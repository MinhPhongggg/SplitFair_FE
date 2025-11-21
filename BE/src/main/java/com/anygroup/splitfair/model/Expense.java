package com.anygroup.splitfair.model;

import com.anygroup.splitfair.enums.ExpenseStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "expense")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // ====== RELATIONS ======

    @ManyToOne
    @JoinColumn(name = "bill_id")
    private Bill bill;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "paid_by")
    private User paidBy;

    // ✅ Quan hệ 1-N với Debt
    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Debt> debts = new ArrayList<>();

    // ✅ Quan hệ 1-N với ExpenseShare
    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseShare> shares = new ArrayList<>();

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Attachment> attachments = new ArrayList<>();

    // ====== FIELDS ======

    private String description;
    private BigDecimal amount;

    private Instant createdTime = Instant.now();

    @PrePersist
    public void prePersist() {
        if (createdTime == null) {
            createdTime = Instant.now();
        }
    }

    @Enumerated(EnumType.STRING)
    private ExpenseStatus status = ExpenseStatus.PENDING;
}
