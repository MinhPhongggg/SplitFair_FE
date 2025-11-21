package com.anygroup.splitfair.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class GroupMemberDTO {
    private UUID id;
    private UUID groupId;
    private UUID userId;
    private UUID roleId;// LEADER hoặc MEMBER
    private String userName;
    private String roleName;
}