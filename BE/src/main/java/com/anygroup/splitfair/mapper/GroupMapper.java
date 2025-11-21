package com.anygroup.splitfair.mapper;

import com.anygroup.splitfair.dto.GroupDTO;
import com.anygroup.splitfair.model.Group;
import com.anygroup.splitfair.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface GroupMapper {

    // Entity → DTO
    @Mapping(source = "createdBy.id", target = "createdBy")
    GroupDTO toDTO(Group entity);

    // DTO → Entity
    @Mapping(source = "createdBy", target = "createdBy", qualifiedByName = "mapUserFromId")
    Group toEntity(GroupDTO dto);

    // Hàm custom ánh xạ UUID → User
    @Named("mapUserFromId")
    default User mapUserFromId(UUID id) {
        if (id == null) return null;
        User user = new User();
        user.setId(id);
        return user;
    }
}
