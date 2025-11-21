package com.anygroup.splitfair.service.impl;

import com.anygroup.splitfair.dto.CategoryDTO;
import com.anygroup.splitfair.mapper.CategoryMapper;
import com.anygroup.splitfair.model.Category;
import com.anygroup.splitfair.repository.CategoryRepository;
import com.anygroup.splitfair.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Override
    public CategoryDTO createCategory(CategoryDTO dto) {
        // Kiểm tra trùng tên
        categoryRepository.findByCategoryName(dto.getName())
                .ifPresent(c -> {
                    throw new RuntimeException("Category with name '" + dto.getName() + "' already exists");
                });

        Category category = categoryMapper.toEntity(dto);
        category.setCategoryName(dto.getName());
        category = categoryRepository.save(category);
        return categoryMapper.toDTO(category);
    }

    @Override
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll()
                .stream()
                .map(categoryMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryDTO getCategoryById(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        return categoryMapper.toDTO(category);
    }

    @Override
    public CategoryDTO updateCategory(CategoryDTO dto) {
        Category existing = categoryRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + dto.getId()));

        existing.setCategoryName(dto.getName());
        existing.setDescription(dto.getDescription());

        categoryRepository.save(existing);
        return categoryMapper.toDTO(existing);
    }

    @Override
    public void deleteCategory(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        categoryRepository.delete(category);
    }
}
