package com.anygroup.splitfair.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "attachment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String fileName;
    private String filePath;

    private LocalDateTime uploadedAt;

    @ManyToOne
    @JoinColumn(name = "expense_id")
    private Expense expense;
}
