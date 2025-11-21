package com.anygroup.splitfair.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class CategoryDTO {
    private UUID id;
    private String name;
    private String description;
}