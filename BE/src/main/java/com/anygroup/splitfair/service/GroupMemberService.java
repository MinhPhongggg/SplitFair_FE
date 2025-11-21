package com.anygroup.splitfair.service;

import com.anygroup.splitfair.dto.GroupMemberDTO;
import java.util.List;
import java.util.UUID;

public interface GroupMemberService {
    List<GroupMemberDTO> getMembersByGroup(UUID groupId);
    GroupMemberDTO addMember(GroupMemberDTO dto);
    void removeMember(UUID id);
    List<GroupMemberDTO> getGroupsByUser(UUID userId);
}