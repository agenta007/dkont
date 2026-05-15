package com.example.logistics.web;

import com.example.logistics.service.AuthService;
import com.example.logistics.service.AuthService.AuthSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthApiController {

    private final AuthService authService;

    @PostMapping("/login")
    public AuthSession login(@RequestParam String username, @RequestParam String password) {
        return authService.login(username, password);
    }

    @PostMapping("/register")
    public AuthSession register(@RequestParam String username,
                                @RequestParam String password,
                                @RequestParam(required = false) String email) {
        return authService.registerClient(username, password, email);
    }
}
