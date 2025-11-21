package com.anygroup.splitfair.dto.Auth;

import lombok.Data;

@Data
public class RegisterRequest {
    private String userName;
    private String email;
    private String password;
}