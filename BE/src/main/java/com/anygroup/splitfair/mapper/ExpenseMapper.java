package com.anygroup.splitfair.mapper;

import com.anygroup.splitfair.dto.ExpenseDTO;
import com.anygroup.splitfair.model.Expense;
import com.anygroup.splitfair.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.UUID;


@Mapper(componentModel = "spring")
public interface ExpenseMapper {

    // Entity → DTO
    @Mapping(source = "bill.id", target = "billId")
    @Mapping(source = "bill.group.id", target = "groupId")
    @Mapping(source = "paidBy.id", target = "paidBy")
    @Mapping(source = "createdBy.id", target = "createdBy")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "status", target = "status")
    ExpenseDTO toDTO(Expense entity);

    // DTO → Entity
    @Mapping(source = "billId", target = "bill.id")
    @Mapping(source = "paidBy", target = "paidBy", qualifiedByName = "mapUserFromId")
    @Mapping(source = "createdBy", target = "createdBy", qualifiedByName = "mapUserFromId")
    @Mapping(source = "userId", target = "user", qualifiedByName = "mapUserFromId")
    Expense toEntity(ExpenseDTO dto);

    // Helper: UUID → User
    @Named("mapUserFromId")
    default User mapUserFromId(UUID id) {
        if (id == null) return null;
        User user = new User();
        user.setId(id);
        return user;
    }
}
