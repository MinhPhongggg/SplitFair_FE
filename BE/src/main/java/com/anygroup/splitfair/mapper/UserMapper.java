package com.anygroup.splitfair.mapper;

import com.anygroup.splitfair.dto.UserDTO;
import com.anygroup.splitfair.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(source = "userName", target = "name")
    @Mapping(source = "role.id", target = "roleId")
    UserDTO toDTO(User user);

    @Mapping(source = "name", target = "userName")
    @Mapping(source = "roleId", target = "role.id")
    User toEntity(UserDTO dto);

}