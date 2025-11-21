package com.anygroup.splitfair.service;

import com.anygroup.splitfair.dto.CategoryDTO;
import java.util.List;
import java.util.UUID;

public interface CategoryService {
    CategoryDTO createCategory(CategoryDTO dto);

    List<CategoryDTO> getAllCategories();

    CategoryDTO getCategoryById(UUID id);

    CategoryDTO updateCategory(CategoryDTO dto);

    void deleteCategory(UUID id);
}