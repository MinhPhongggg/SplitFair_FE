package com.anygroup.splitfair.model;

import jakarta.persistence.*;
import lombok.*;
import com.anygroup.splitfair.enums.RoleType;

import java.util.UUID;

@Entity
@Table(name = "role")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING) // Lưu RoleType dưới dạng text ("ADMIN", "USER")
    @Column(nullable = false, unique = true, length = 100)
    private RoleType name;
}
