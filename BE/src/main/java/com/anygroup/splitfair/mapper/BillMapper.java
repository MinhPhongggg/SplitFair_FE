package com.anygroup.splitfair.mapper;

import com.anygroup.splitfair.dto.BillDTO;
import com.anygroup.splitfair.model.Bill;
import com.anygroup.splitfair.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface BillMapper {

    // Entity → DTO
    @Mappings({
            @Mapping(source = "group.id", target = "groupId"),
            @Mapping(source = "category.id", target = "categoryId"),
            @Mapping(source = "createdBy.id", target = "createdBy")
    })
    BillDTO toDTO(Bill entity);

    //  DTO → Entity
    @Mappings({
            @Mapping(source = "groupId", target = "group.id"),
            @Mapping(source = "categoryId", target = "category.id"),
            @Mapping(source = "createdBy", target = "createdBy", qualifiedByName = "mapUserFromId"),

            // ⚠️ Quan trọng: bỏ qua 2 field này để giữ mặc định
            @Mapping(target = "status", ignore = true),
            @Mapping(target = "createdTime", ignore = true)
    })
    Bill toEntity(BillDTO dto);

    //  Custom converter UUID → User
    @Named("mapUserFromId")
    default User mapUserFromId(UUID id) {
        if (id == null) return null;
        User user = new User();
        user.setId(id);
        return user;
    }
}
