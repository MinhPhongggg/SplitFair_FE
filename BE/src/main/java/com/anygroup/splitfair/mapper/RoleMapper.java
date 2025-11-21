package com.anygroup.splitfair.mapper;

import com.anygroup.splitfair.dto.RoleDTO;
import com.anygroup.splitfair.model.Role;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    RoleDTO toDTO(Role entity);
    Role toEntity(RoleDTO dto);
}