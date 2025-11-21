package com.anygroup.splitfair.controller;

import com.anygroup.splitfair.dto.Auth.*;
import com.anygroup.splitfair.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/account")
    public ResponseEntity<AuthResponse> getAccount(Authentication authentication) {
        String email = ((User) authentication.getPrincipal()).getUsername();
        return ResponseEntity.ok(authService.getAccount(email));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@RequestBody ChangePasswordRequest request, Authentication authentication) {
        String email = ((User) authentication.getPrincipal()).getUsername();
        authService.changePassword(email, request);
        return ResponseEntity.ok().build();
    }
}
