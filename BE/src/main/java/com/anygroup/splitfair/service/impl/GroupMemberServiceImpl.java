package com.anygroup.splitfair.service.impl;

import com.anygroup.splitfair.dto.GroupMemberDTO;
import com.anygroup.splitfair.mapper.GroupMemberMapper;
import com.anygroup.splitfair.model.Group;
import com.anygroup.splitfair.model.GroupMember;
import com.anygroup.splitfair.model.Role;
import com.anygroup.splitfair.model.User;
import com.anygroup.splitfair.repository.GroupMemberRepository;
import com.anygroup.splitfair.repository.GroupRepository;
import com.anygroup.splitfair.repository.RoleRepository;
import com.anygroup.splitfair.repository.UserRepository;
import com.anygroup.splitfair.service.GroupMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupMemberServiceImpl implements GroupMemberService {

    private final GroupMemberRepository groupMemberRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final GroupMemberMapper groupMemberMapper;



    //Lấy tất cả thành viên của một group
    @Override
    public List<GroupMemberDTO> getMembersByGroup(UUID groupId) {
        return groupMemberRepository.findAll()
                .stream()
                .filter(m -> m.getGroup() != null && m.getGroup().getId().equals(groupId))
                .map(groupMemberMapper::toDTO)
                .collect(Collectors.toList());
    }

    //Thêm một thành viên mới vào nhóm (có kiểm tra trùng)
    @Override
    public GroupMemberDTO addMember(GroupMemberDTO dto) {
        // Kiểm tra Group
        Group group = groupRepository.findById(dto.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + dto.getGroupId()));

        // Kiểm tra User
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + dto.getUserId()));

        // Kiểm tra Role
        Role role = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + dto.getRoleId()));

        // Kiểm tra xem user đã có trong group chưa
        boolean exists = groupMemberRepository.findAll().stream()
                .anyMatch(m -> m.getGroup() != null &&
                        m.getGroup().getId().equals(dto.getGroupId()) &&
                        m.getUser() != null &&
                        m.getUser().getId().equals(dto.getUserId()));

        if (exists) {
            throw new RuntimeException("User already exists in this group!");
        }

        // Map DTO -> Entity
        GroupMember entity = GroupMember.builder()
                .group(group)
                .user(user)
                .role(role)
                .build();

        entity = groupMemberRepository.save(entity);
        return groupMemberMapper.toDTO(entity);
    }

    // Xóa thành viên khỏi nhóm

    @Override
    public void removeMember(UUID id) {
        if (!groupMemberRepository.existsById(id)) {
            throw new RuntimeException("GroupMember not found with id: " + id);
        }
        groupMemberRepository.deleteById(id);
    }

    //Lấy tất cả các nhóm mà một người đang tham gia

    @Override
    public List<GroupMemberDTO> getGroupsByUser(UUID userId) {
        return groupMemberRepository.findAll()
                .stream()
                .filter(m -> m.getUser() != null && m.getUser().getId().equals(userId))
                .map(groupMemberMapper::toDTO)
                .collect(Collectors.toList());
    }
}
