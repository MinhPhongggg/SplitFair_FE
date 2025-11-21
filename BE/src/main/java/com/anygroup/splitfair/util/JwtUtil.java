package com.anygroup.splitfair.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    // 🔑 Secret key dài >= 32 ký tự để tránh lỗi base64
    private static final String SECRET_KEY = "splitfairSecretKey2025splitfairSecretKey2025";

    // 🔐 Thời gian sống của token (10 tiếng)
    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 10;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    // ✅ Tạo token
    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ✅ Trích xuất email (subject) từ token
    public String getEmailFromToken(String token) {
        return extractAllClaims(token).getSubject();
    }

    // ✅ Kiểm tra token hợp lệ (chữ ký + hết hạn)
    public boolean validateToken(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            System.out.println("❌ Token expired: " + e.getMessage());
        } catch (JwtException e) {
            System.out.println("❌ Invalid token: " + e.getMessage());
        }
        return false;
    }

    // ✅ Giải mã toàn bộ Claims
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}