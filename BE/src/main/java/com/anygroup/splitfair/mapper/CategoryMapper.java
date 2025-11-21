package com.anygroup.splitfair.mapper;

import com.anygroup.splitfair.dto.CategoryDTO;
import com.anygroup.splitfair.model.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    //  Map từ Entity -> DTO (categoryName -> name)
    @Mapping(source = "categoryName", target = "name")
    CategoryDTO toDTO(Category entity);

    // Map từ DTO -> Entity (name -> categoryName)
    @Mapping(source = "name", target = "categoryName")
    Category toEntity(CategoryDTO dto);
}
