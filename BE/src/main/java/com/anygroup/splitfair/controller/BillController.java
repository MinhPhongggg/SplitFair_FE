package com.anygroup.splitfair.controller;

import com.anygroup.splitfair.dto.BillDTO;
import com.anygroup.splitfair.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;


    @PostMapping
    public ResponseEntity<BillDTO> createBill(@RequestBody BillDTO dto) {
        BillDTO created = billService.createBill(dto);
        return ResponseEntity.ok(created);
    }


    @GetMapping
    public ResponseEntity<List<BillDTO>> getAllBills() {
        return ResponseEntity.ok(billService.getAllBills());
    }


    @GetMapping("/{id}")
    public ResponseEntity<BillDTO> getBillById(@PathVariable UUID id) {
        return ResponseEntity.ok(billService.getBillById(id));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<BillDTO>> getBillsByGroup(@PathVariable UUID groupId) {
        return ResponseEntity.ok(billService.getBillsByGroup(groupId));
    }


    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BillDTO>> getBillsByUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(billService.getBillsByUser(userId));
    }


    @PutMapping("/{id}")
    public ResponseEntity<BillDTO> updateBill(@PathVariable UUID id, @RequestBody BillDTO dto) {
        dto.setId(id);
        BillDTO updated = billService.updateBill(dto);
        return ResponseEntity.ok(updated);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBill(@PathVariable UUID id) {
        billService.deleteBill(id);
        return ResponseEntity.noContent().build();
    }
}
