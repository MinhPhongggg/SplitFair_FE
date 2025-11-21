package com.anygroup.splitfair.repository;

import com.anygroup.splitfair.enums.RoleType;
import com.anygroup.splitfair.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {

    // Tìm Role theo tên (ADMIN, USER, LEADER, MEMBER)
    Optional<Role> findByName(RoleType name);

    boolean existsByName(RoleType name);
}