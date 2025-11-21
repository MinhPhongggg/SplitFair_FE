package com.anygroup.splitfair.dto;

import com.anygroup.splitfair.enums.UserStatus;
import lombok.Data;
import java.util.UUID;

@Data
public class UserDTO {
    private UUID id;
    private String name;
    private String email;
    private UserStatus status;
    private UUID roleId;
    private String avatar;
}