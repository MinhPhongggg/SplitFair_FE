package com.anygroup.splitfair.controller;

import com.anygroup.splitfair.dto.RoleDTO;
import com.anygroup.splitfair.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;


    @PostMapping
    public ResponseEntity<RoleDTO> createRole(@RequestBody RoleDTO dto) {
        RoleDTO created = roleService.createRole(dto);
        return ResponseEntity.ok(created);
    }


    @GetMapping
    public ResponseEntity<List<RoleDTO>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }


    @GetMapping("/{id}")
    public ResponseEntity<RoleDTO> getRoleById(@PathVariable UUID id) {
        RoleDTO role = roleService.getRoleById(id);
        return ResponseEntity.ok(role);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable UUID id) {
        roleService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }
}
