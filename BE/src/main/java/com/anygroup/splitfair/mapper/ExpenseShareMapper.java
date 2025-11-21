package com.anygroup.splitfair.mapper;

import com.anygroup.splitfair.dto.ExpenseShareDTO;
import com.anygroup.splitfair.model.ExpenseShare;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

/**
 * ✅ Mapper ánh xạ giữa ExpenseShare ↔ ExpenseShareDTO
 * Loại bỏ mapping expenseId → expense.id để tránh tạo Expense "mồ côi".
 */
@Mapper(componentModel = "spring")
public interface ExpenseShareMapper {

    // Entity → DTO
    @Mappings({
            @Mapping(target = "expenseId",
                    expression = "java(entity.getExpense() != null ? entity.getExpense().getId() : null)"),
            @Mapping(target = "userId",
                    expression = "java(entity.getUser() != null ? entity.getUser().getId() : null)")
    })
    ExpenseShareDTO toDTO(ExpenseShare entity);

    // DTO → Entity không map expenseId nữa để tránh lỗi transient)
    @Mappings({
            // @Mapping(source = "expenseId", target = "expense.id"),  // bỏ đi
            @Mapping(source = "userId", target = "user.id")
    })
    ExpenseShare toEntity(ExpenseShareDTO dto);
}
