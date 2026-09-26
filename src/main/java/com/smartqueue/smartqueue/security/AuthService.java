package com.smartqueue.smartqueue.security;

import com.smartqueue.smartqueue.dto.LoginRequest;
import com.smartqueue.smartqueue.dto.RegisterRequest;
import com.smartqueue.smartqueue.model.User;
import com.smartqueue.smartqueue.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public String register(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());

        // Never store the plain password
        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        // Normal registration always creates a customer
        user.setRole("CUSTOMER");

        userRepository.save(user);

        return "Registration successful";
    }

    public String login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var userDetails = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return jwtService.generateToken(
                org.springframework.security.core.userdetails.User
                        .withUsername(userDetails.getEmail())
                        .password(userDetails.getPassword())
                        .authorities("ROLE_" + userDetails.getRole())
                        .build()
        );
    }
}