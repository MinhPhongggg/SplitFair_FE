package com.anygroup.splitfair.controller;

import com.anygroup.splitfair.dto.GroupMemberDTO;
import com.anygroup.splitfair.service.GroupMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/group-members")
@RequiredArgsConstructor
public class GroupMemberController {

    private final GroupMemberService groupMemberService;


    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<GroupMemberDTO>> getMembersByGroup(@PathVariable UUID groupId) {
        List<GroupMemberDTO> members = groupMemberService.getMembersByGroup(groupId);
        return ResponseEntity.ok(members);
    }


    @PostMapping
    public ResponseEntity<GroupMemberDTO> addMember(@RequestBody GroupMemberDTO dto) {
        GroupMemberDTO added = groupMemberService.addMember(dto);
        return ResponseEntity.ok(added);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeMember(@PathVariable UUID id) {
        groupMemberService.removeMember(id);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/user/{userId}")
    public ResponseEntity<List<GroupMemberDTO>> getGroupsByUser(@PathVariable UUID userId) {
        List<GroupMemberDTO> groups = groupMemberService.getGroupsByUser(userId);
        return ResponseEntity.ok(groups);
    }
}
