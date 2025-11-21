package com.anygroup.splitfair.repository;

import com.anygroup.splitfair.model.Group;
import com.anygroup.splitfair.model.GroupMember;
import com.anygroup.splitfair.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, UUID> {

    // Lấy tất cả thành viên trong 1 nhóm
    List<GroupMember> findByGroup(Group group);

    // Lấy tất cả nhóm mà user tham gia
    List<GroupMember> findByUser(User user);

    // Kiểm tra user đã thuộc group chưa
    Optional<GroupMember> findByGroupAndUser(Group group, User user);

    // Xóa toàn bộ thành viên khi xóa group
    void deleteAllByGroup_Id(UUID groupId);
}
