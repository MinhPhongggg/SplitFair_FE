
package com.anygroup.splitfair.config;

import com.anygroup.splitfair.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// *** 1. THÊM CÁC IMPORT NÀY VÀO ***
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                // *** 2. KÍCH HOẠT CORS ***
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                
                .authorizeHttpRequests(auth -> auth
                        // Cho phép login/register không cần xác thực
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/auth/account").authenticated()

                        // ✅ Cho phép ADMIN hoặc LEADER xóa expense
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/expenses/**")
                        .hasAnyAuthority("ADMIN", "LEADER")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users/avatar/**").permitAll()

                        // ✅ Các API khác yêu cầu đăng nhập
                        .requestMatchers("/api/expenses/**",
                                "/api/bills/**",
                                "/api/groups/**",
                                "/api/categories/**",
                                "/api/users/**",
                                "/api/attachments/**",
                                "/api/expense-shares/**",
                                "/uploads/**").authenticated()

                        .anyRequest().authenticated()
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // *** 3. THÊM BEAN CẤU HÌNH CORS NÀY VÀO ***
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Cho phép TẤT CẢ các nguồn (Origins) - An toàn cho development
        configuration.setAllowedOrigins(List.of("*")); 
        
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        // configuration.setAllowCredentials(true); // Tạm thời có thể không cần
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Áp dụng cho tất cả API
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    // (BẮT BUỘC) Thêm Bean này để AuthServiceImpl có thể inject AuthenticationManager
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}