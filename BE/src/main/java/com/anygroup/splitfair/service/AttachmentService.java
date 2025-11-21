package com.anygroup.splitfair.service;

import com.anygroup.splitfair.dto.AttachmentDTO;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

public interface AttachmentService {
    AttachmentDTO uploadFile(UUID expenseId, MultipartFile file) throws IOException;
    List<AttachmentDTO> getAttachmentsByExpense(UUID expenseId);
    AttachmentDTO getAttachmentById(UUID id);
    byte[] downloadFile(UUID id) throws IOException;
    void deleteAttachment(UUID id);
}
