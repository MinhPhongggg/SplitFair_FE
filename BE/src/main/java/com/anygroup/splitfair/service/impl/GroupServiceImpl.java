package com.anygroup.splitfair.service.impl;

import com.anygroup.splitfair.dto.GroupDTO;
import com.anygroup.splitfair.dto.GroupMemberDTO;
import com.anygroup.splitfair.enums.RoleType;
import com.anygroup.splitfair.mapper.GroupMapper;
import com.anygroup.splitfair.mapper.GroupMemberMapper;
import com.anygroup.splitfair.model.*;
import com.anygroup.splitfair.repository.*;
import com.anygroup.splitfair.enums.NotificationType;
import com.anygroup.splitfair.service.GroupService;
import com.anygroup.splitfair.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupServiceImpl implements GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final GroupMapper groupMapper;
    private final GroupMemberMapper groupMemberMapper;
    private final NotificationService notificationService;
    private final BillRepository billRepository; // Inject BillRepository
    private final ExpenseRepository expenseRepository; // Inject ExpenseRepository
    private final DebtRepository debtRepository; // Inject DebtRepository

    @Override
    public GroupDTO createGroup(GroupDTO dto, UUID creatorId) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + creatorId));

        Group group = Group.builder()
                .groupName(dto.getGroupName())
                .description(dto.getDescription())
                .createdBy(creator)
                .createdTime(Instant.now())
                .build();

        group = groupRepository.save(group);

        Role leaderRole = roleRepository.findByName(RoleType.LEADER)
                .orElseThrow(() -> new RuntimeException("Role LEADER not found"));

        creator.setRole(leaderRole);
        userRepository.save(creator);

        GroupMember leader = GroupMember.builder()
                .group(group)
                .user(creator)
                .role(leaderRole)
                .build();

        groupMemberRepository.save(leader);

        return groupMapper.toDTO(group);
    }

//     @Override
//     public List<GroupDTO> getAllGroups() {
//         return groupRepository.findAll()
//                 .stream()
//                 .map(group -> {
//                     GroupDTO dto = groupMapper.toDTO(group);

//                     List<GroupMemberDTO> members = groupMemberRepository.findByGroup(group)
//                             .stream()
//                             .map(groupMemberMapper::toDTO)
//                             .collect(Collectors.toList());
//                     dto.setMembers(members);

//                     return dto;
//                 })
//                 .collect(Collectors.toList());
//     }

        @Override
    public List<GroupDTO> getGroupsByUserEmail(String email) {
        // 1. Tìm user đang đăng nhập
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Tìm tất cả nhóm mà user này là thành viên
        return groupMemberRepository.findByUser(user)
                .stream()
                .map(GroupMember::getGroup) // Lấy Group từ GroupMember
                .map(group -> {
                    // (Logic map giống getAllGroups cũ)
                    GroupDTO dto = groupMapper.toDTO(group);
                    
                    List<GroupMemberDTO> members = groupMemberRepository.findByGroup(group)
                            .stream()
                            .map(groupMemberMapper::toDTO)
                            .collect(Collectors.toList());
                    dto.setMembers(members);

                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public GroupDTO getGroupById(UUID id) {
        Group group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + id));

        GroupDTO dto = groupMapper.toDTO(group);

        List<GroupMemberDTO> members = groupMemberRepository.findByGroup(group)
                .stream()
                .map(groupMemberMapper::toDTO)
                .collect(Collectors.toList());
        dto.setMembers(members);

        return dto;
    }

    @Override
    public List<GroupDTO> getGroupsCreatedByUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        return groupRepository.findByCreatedBy(user)
                .stream()
                .map(group -> {
                    GroupDTO dto = groupMapper.toDTO(group);

                    List<GroupMemberDTO> members = groupMemberRepository.findByGroup(group)
                            .stream()
                            .map(groupMemberMapper::toDTO)
                            .collect(Collectors.toList());
                    dto.setMembers(members);

                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public void addMemberToGroup(UUID groupId, UUID userId) {
        System.out.println("Adding member " + userId + " to group " + groupId); // LOG
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + groupId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        if (groupMemberRepository.findByGroupAndUser(group, user).isPresent()) {
            throw new RuntimeException("User already in this group");
        }

        Role memberRole = roleRepository.findByName(RoleType.MEMBER)
                .orElseThrow(() -> new RuntimeException("Role MEMBER not found"));

        GroupMember newMember = GroupMember.builder()
                .group(group)
                .user(user)
                .role(memberRole)
                .build();

        groupMemberRepository.save(newMember);

        System.out.println("Member added. Sending notification to " + userId); // LOG
        // Gửi thông báo cho user
        notificationService.createNotification(
                userId,
                "Tham gia nhóm",
                "Bạn đã được thêm vào nhóm " + group.getGroupName(),
                NotificationType.GROUP_INVITE,
                group.getId().toString()
        );
        System.out.println("Notification sent to " + userId); // LOG
    }

    @Override
    public List<GroupMember> getMembersByGroup(UUID groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        return groupMemberRepository.findByGroup(group);
    }

    @Override
    public void deleteGroup(UUID id) {
        Group group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        // 1. Xóa tất cả các khoản nợ (Debt) liên quan đến nhóm này
        // (Debt liên kết với Expense -> Expense liên kết với Bill -> Bill liên kết với Group)
        // Cách đơn giản nhất là tìm tất cả Bill của Group, rồi tìm Expense, rồi xóa Debt.
        // Tuy nhiên, nếu cấu hình Cascade đúng thì chỉ cần xóa Bill là đủ.
        // Nhưng để chắc chắn, ta xóa thủ công hoặc dựa vào Cascade từ Bill.
        
        // Ở đây ta sẽ xóa Bill, và nhờ CascadeType.ALL + orphanRemoval=true trong Bill -> Expense -> Debt/Share để xóa hết.
        // Kiểm tra lại Entity Bill:
        // @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, orphanRemoval = true)
        // private List<Expense> expenses;
        
        // Kiểm tra Entity Expense:
        // @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
        // private List<Debt> debts;
        
        // Vậy chỉ cần xóa Bill là đủ.
        List<Bill> bills = billRepository.findByGroup(group);
        billRepository.deleteAll(bills);

        // 2. Xóa thành viên
        groupMemberRepository.deleteAllByGroup_Id(group.getId());
        
        // 3. Xóa nhóm
        groupRepository.delete(group);
    }


    @Override
    public GroupDTO updateGroup(UUID groupId, GroupDTO dto) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + groupId));
        
        // Cập nhật thông tin
        group.setGroupName(dto.getGroupName());
        group.setDescription(dto.getDescription());
        
        // Lưu vào DB
        group = groupRepository.save(group);
        
        return groupMapper.toDTO(group);
    }
}
