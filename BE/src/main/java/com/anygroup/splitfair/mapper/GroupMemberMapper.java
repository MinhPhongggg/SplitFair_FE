package com.anygroup.splitfair.mapper;

import com.anygroup.splitfair.dto.GroupMemberDTO;
import com.anygroup.splitfair.model.Group;
import com.anygroup.splitfair.model.Role;
import com.anygroup.splitfair.model.User;
import com.anygroup.splitfair.model.GroupMember;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface GroupMemberMapper {

    // Entity → DTO
    @Mapping(source = "group.id", target = "groupId")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.userName", target = "userName")
    @Mapping(source = "role.id", target = "roleId")
    @Mapping(source = "role.name", target = "roleName")
    GroupMemberDTO toDTO(GroupMember entity);

    // DTO → Entity
    @Mapping(source = "groupId", target = "group", qualifiedByName = "mapGroupFromId")
    @Mapping(source = "userId", target = "user", qualifiedByName = "mapUserFromId")
    @Mapping(source = "roleId", target = "role", qualifiedByName = "mapRoleFromId")
    GroupMember toEntity(GroupMemberDTO dto);

    // --- Custom mapping helpers ---
    @Named("mapGroupFromId")
    default Group mapGroupFromId(UUID id) {
        if (id == null) return null;
        Group g = new Group();
        g.setId(id);
        return g;
    }

    @Named("mapUserFromId")
    default User mapUserFromId(UUID id) {
        if (id == null) return null;
        User u = new User();
        u.setId(id);
        return u;
    }

    @Named("mapRoleFromId")
    default Role mapRoleFromId(UUID id) {
        if (id == null) return null;
        Role r = new Role();
        r.setId(id);
        return r;
    }
}
