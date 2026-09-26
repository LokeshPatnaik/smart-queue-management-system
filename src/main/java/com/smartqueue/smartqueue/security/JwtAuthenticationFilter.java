package com.smartqueue.smartqueue.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            CustomUserDetailsService userDetailsService) {

        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String requestPath = request.getRequestURI();

        String authHeader =
                request.getHeader("Authorization");

        System.out.println(
                "JWT FILTER → " +
                        request.getMethod() +
                        " " +
                        requestPath
        );

        // No JWT provided
        if (authHeader == null ||
                !authHeader.startsWith("Bearer ")) {

            System.out.println(
                    "JWT FILTER → No Bearer token"
            );

            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        String email;

        try {

            email = jwtService.extractUsername(token);

            System.out.println(
                    "JWT FILTER → Token belongs to: " +
                            email
            );

        } catch (Exception e) {

            System.out.println(
                    "JWT FILTER → Token extraction FAILED: " +
                            e.getMessage()
            );

            filterChain.doFilter(request, response);
            return;
        }

        if (email != null &&
                SecurityContextHolder
                        .getContext()
                        .getAuthentication() == null) {

            try {

                UserDetails userDetails =
                        userDetailsService
                                .loadUserByUsername(email);

                System.out.println(
                        "JWT FILTER → User found: " +
                                userDetails.getUsername()
                );

                System.out.println(
                        "JWT FILTER → Authorities: " +
                                userDetails.getAuthorities()
                );

                boolean valid =
                        jwtService.isTokenValid(
                                token,
                                userDetails
                        );

                System.out.println(
                        "JWT FILTER → Token valid: " +
                                valid
                );

                if (valid) {

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(
                                    authentication
                            );

                    System.out.println(
                            "JWT FILTER → Authentication SUCCESS"
                    );
                }

            } catch (Exception e) {

                System.out.println(
                        "JWT FILTER → Authentication FAILED: " +
                                e.getMessage()
                );
            }
        }

        filterChain.doFilter(request, response);
    }
}