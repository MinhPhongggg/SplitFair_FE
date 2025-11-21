package com.anygroup.splitfair.service.impl;

import com.anygroup.splitfair.dto.RoleDTO;
import com.anygroup.splitfair.enums.RoleType;
import com.anygroup.splitfair.mapper.RoleMapper;
import com.anygroup.splitfair.model.Role;
import com.anygroup.splitfair.repository.RoleRepository;
import com.anygroup.splitfair.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;


    @Override
    public RoleDTO createRole(RoleDTO dto) {
        // Kiểm tra nếu role đã tồn tại (theo enum name)
        RoleType roleType;
        try {
            roleType = RoleType.valueOf(dto.getName().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role name: " + dto.getName());
        }

        // Nếu role đã tồn tại → ném lỗi
        if (roleRepository.findByName(roleType).isPresent()) {
            throw new RuntimeException("Role already exists: " + dto.getName());
        }

        // Tạo mới role entity
        Role role = Role.builder()
                .name(roleType)
                .build();

        role = roleRepository.save(role);

        return roleMapper.toDTO(role);
    }


    @Override
    public List<RoleDTO> getAllRoles() {
        return roleRepository.findAll()
                .stream()
                .map(roleMapper::toDTO)
                .collect(Collectors.toList());
    }


    @Override
    public RoleDTO getRoleById(UUID id) {
        return roleRepository.findById(id)
                .map(roleMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
    }


    @Override
    public void deleteRole(UUID id) {
        if (!roleRepository.existsById(id)) {
            throw new RuntimeException("Role not found with id: " + id);
        }
        roleRepository.deleteById(id);
    }
}
