package com.anygroup.splitfair.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "group_table") // "group" là từ khóa SQL, nên tránh dùng
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String groupName;

    private String description;

    private Instant createdTime = Instant.now();

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;
}