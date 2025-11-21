package com.anygroup.splitfair.service;

import com.anygroup.splitfair.dto.RoleDTO;
import java.util.List;
import java.util.UUID;

public interface RoleService {
    RoleDTO createRole(RoleDTO dto);
    List<RoleDTO> getAllRoles();
    RoleDTO getRoleById(UUID id);
    void deleteRole(UUID id);
}
