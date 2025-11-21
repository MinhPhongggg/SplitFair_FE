package com.anygroup.splitfair.dto.Auth;

import java.util.UUID;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String userName;
    private String role;
    // thêm userId vào AuthResponse
    private UUID userId;
    private String email;
}