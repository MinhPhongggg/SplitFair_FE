package com.anygroup.splitfair.service;

import com.anygroup.splitfair.dto.BillDTO;
import java.util.List;
import java.util.UUID;

public interface BillService {
    BillDTO createBill(BillDTO dto);

    BillDTO getBillById(UUID id);

    List<BillDTO> getBillsByGroup(UUID groupId);

    List<BillDTO> getBillsByUser(UUID userId);

    List<BillDTO> getAllBills();

    BillDTO updateBill(BillDTO dto);

    void deleteBill(UUID id);
}
