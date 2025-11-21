package com.anygroup.splitfair.repository;

import com.anygroup.splitfair.model.Group;
import com.anygroup.splitfair.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GroupRepository extends JpaRepository<Group, UUID> {

    // Tìm tất cả group mà user này tạo
    List<Group> findByCreatedBy(User createdBy);

    // Tìm group theo tên (cho phép search gần đúng)
    List<Group> findByGroupNameContainingIgnoreCase(String groupName);
}