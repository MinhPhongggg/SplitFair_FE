package com.anygroup.splitfair.mapper;

import com.anygroup.splitfair.dto.AttachmentDTO;
import com.anygroup.splitfair.model.Attachment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AttachmentMapper {
    @Mapping(source = "expense.id", target = "expenseId")
    AttachmentDTO toDTO(Attachment entity);

    @Mapping(source = "expenseId", target = "expense.id")
    Attachment toEntity(AttachmentDTO dto);
}
