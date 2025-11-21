package com.anygroup.splitfair.controller;

import com.anygroup.splitfair.dto.AttachmentDTO;
import com.anygroup.splitfair.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    @PostMapping("/upload/{expenseId}")
    public ResponseEntity<AttachmentDTO> uploadFile(
            @PathVariable UUID expenseId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(attachmentService.uploadFile(expenseId, file));
    }

    @GetMapping("/expense/{expenseId}")
    public ResponseEntity<List<AttachmentDTO>> getAttachmentsByExpense(@PathVariable UUID expenseId) {
        return ResponseEntity.ok(attachmentService.getAttachmentsByExpense(expenseId));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable UUID id) throws IOException {
        AttachmentDTO dto = attachmentService.getAttachmentById(id);
        byte[] data = attachmentService.downloadFile(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + dto.getFileName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable UUID id) {
        attachmentService.deleteAttachment(id);
        return ResponseEntity.noContent().build();
    }
}
