package com.smartqueue.smartqueue.controller;

import com.smartqueue.smartqueue.dto.LoginRequest;
import com.smartqueue.smartqueue.dto.RegisterRequest;
import com.smartqueue.smartqueue.security.AuthService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public Map<String, String> register(
            @RequestBody RegisterRequest request) {

        String message = authService.register(request);

        return Map.of("message", message);
    }

    @PostMapping("/login")
    public Map<String, String> login(
            @RequestBody LoginRequest request) {

        String token = authService.login(request);

        return Map.of("token", token);
    }
}