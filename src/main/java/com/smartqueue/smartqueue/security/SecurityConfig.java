package com.smartqueue.smartqueue.security;

import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {

        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration)
            throws Exception {

        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http)
            throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // Login and registration
                        .requestMatchers("/api/auth/**")
                        .permitAll()

                        // Customers need to see available services
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/services"
                        )
                        .permitAll()

                        // Only staff can call the next customer
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/tickets/call-next/**"
                        )
                        .hasAuthority("ROLE_STAFF")

                        // Only staff can complete a ticket
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/tickets/*/complete"
                        )
                        .hasAuthority("ROLE_STAFF")

                        // Customers and staff can access tickets
                        .requestMatchers("/api/tickets/**")
                        .hasAnyAuthority(
                                "ROLE_CUSTOMER",
                                "ROLE_STAFF"
                        )

                        // Everything else requires authentication
                        .anyRequest()
                        .authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}