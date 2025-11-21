package com.anygroup.splitfair.service;

import com.anygroup.splitfair.dto.Auth.AuthResponse;
import com.anygroup.splitfair.dto.Auth.LoginRequest;
import com.anygroup.splitfair.dto.Auth.RegisterRequest;

import com.anygroup.splitfair.dto.Auth.ChangePasswordRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse getAccount(String email);
    void changePassword(String email, ChangePasswordRequest request);
}
