package com.anygroup.splitfair.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AttachmentDTO {
    private UUID id;
    private UUID expenseId;
    private String fileName;
    private String downloadUrl;
    private LocalDateTime uploadedAt;
}
