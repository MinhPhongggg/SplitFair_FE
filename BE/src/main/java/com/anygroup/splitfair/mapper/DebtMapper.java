package com.anygroup.splitfair.mapper;

import com.anygroup.splitfair.dto.DebtDTO;
import com.anygroup.splitfair.model.Debt;
import com.anygroup.splitfair.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface DebtMapper {

    // Entity → DTO
    @Mapping(source = "expense.id", target = "expenseId")
    @Mapping(source = "amountFrom.id", target = "fromUserId")
    @Mapping(source = "amountTo.id", target = "toUserId")
    @Mapping(target = "groupName", expression = "java(getGroupName(entity))")
    @Mapping(source = "amountFrom.userName", target = "fromUserName")
    @Mapping(source = "amountFrom.avatar", target = "fromUserAvatar")
    @Mapping(source = "amountTo.userName", target = "toUserName")
    @Mapping(source = "amountTo.avatar", target = "toUserAvatar")

    //thêm
    @Mapping(source = "expense.description", target = "expenseDescription")
    @Mapping(source = "expense.createdTime", target = "createdTime")
    //
    DebtDTO toDTO(Debt entity);

    default String getGroupName(Debt entity) {
        if (entity.getExpense() != null && 
            entity.getExpense().getBill() != null && 
            entity.getExpense().getBill().getGroup() != null) {
            return entity.getExpense().getBill().getGroup().getGroupName();
        }
        return "Nhóm không xác định";
    }

    // DTO → Entity
    @Mapping(source = "expenseId", target = "expense.id")
    @Mapping(source = "fromUserId", target = "amountFrom", qualifiedByName = "mapUserFromId")
    @Mapping(source = "toUserId", target = "amountTo", qualifiedByName = "mapUserFromId")
    Debt toEntity(DebtDTO dto);

    // Custom mapper để ánh xạ UUID → User
    @Named("mapUserFromId")
    default User mapUserFromId(UUID id) {
        if (id == null) return null;
        User user = new User();
        user.setId(id);
        return user;
    }
}
