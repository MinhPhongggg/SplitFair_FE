package com.anygroup.splitfair.dto;

import lombok.Data;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
public class GroupDTO {
    private UUID id;
    private String groupName;
    private String description;
    private Instant createdTime;
    private UUID createdBy;
    private List<GroupMemberDTO> members;
}