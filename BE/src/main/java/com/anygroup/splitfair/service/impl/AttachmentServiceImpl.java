package com.anygroup.splitfair.service.impl;

import com.anygroup.splitfair.dto.AttachmentDTO;
import com.anygroup.splitfair.mapper.AttachmentMapper;
import com.anygroup.splitfair.model.Attachment;
import com.anygroup.splitfair.model.Expense;
import com.anygroup.splitfair.repository.AttachmentRepository;
import com.anygroup.splitfair.repository.ExpenseRepository;
import com.anygroup.splitfair.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttachmentServiceImpl implements AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final ExpenseRepository expenseRepository;
    private final AttachmentMapper attachmentMapper;


    @Value("${app.file.storage-location:data/images}")
    private String storageLocation;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Override
    public AttachmentDTO uploadFile(UUID expenseId, MultipartFile file) throws IOException {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + expenseId));


        Path dirPath = Paths.get(System.getProperty("user.dir"), storageLocation);
        if (!Files.exists(dirPath)) {
            Files.createDirectories(dirPath);
        }


        System.out.println(">>> Upload directory: " + dirPath.toAbsolutePath());

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = dirPath.resolve(fileName);


        file.transferTo(filePath.toFile());


        Attachment attachment = Attachment.builder()
                .fileName(file.getOriginalFilename())
                .filePath(filePath.toAbsolutePath().toString())
                .uploadedAt(LocalDateTime.now())
                .expense(expense)
                .build();

        attachment = attachmentRepository.save(attachment);


        AttachmentDTO dto = attachmentMapper.toDTO(attachment);
        dto.setFileName(attachment.getFileName());
        dto.setDownloadUrl(baseUrl + "/api/attachments/download/" + attachment.getId());
        dto.setUploadedAt(attachment.getUploadedAt());
        return dto;
    }

    @Override
    public List<AttachmentDTO> getAttachmentsByExpense(UUID expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + expenseId));

        return attachmentRepository.findByExpense(expense)
                .stream()
                .map(a -> {
                    AttachmentDTO dto = attachmentMapper.toDTO(a);
                    dto.setFileName(a.getFileName());
                    dto.setDownloadUrl(baseUrl + "/api/attachments/download/" + a.getId());
                    dto.setUploadedAt(a.getUploadedAt());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public AttachmentDTO getAttachmentById(UUID id) {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attachment not found with id: " + id));

        AttachmentDTO dto = attachmentMapper.toDTO(attachment);
        dto.setFileName(attachment.getFileName());
        dto.setDownloadUrl(baseUrl + "/api/attachments/download/" + attachment.getId());
        dto.setUploadedAt(attachment.getUploadedAt());
        return dto;
    }

    @Override
    public byte[] downloadFile(UUID id) throws IOException {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attachment not found with id: " + id));

        File file = new File(attachment.getFilePath());
        if (!file.exists()) {
            throw new RuntimeException("File not found on server: " + attachment.getFilePath());
        }
        return Files.readAllBytes(file.toPath());
    }

    @Override
    public void deleteAttachment(UUID id) {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attachment not found with id: " + id));

        File file = new File(attachment.getFilePath());
        if (file.exists()) {
            file.delete();
        }
        attachmentRepository.delete(attachment);
    }
}
