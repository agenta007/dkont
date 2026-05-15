package com.example.logistics.service.impl;

import com.example.logistics.model.*;
import com.example.logistics.repo.*;
import com.example.logistics.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
@Transactional
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional(readOnly = true)
    public AuthSession login(String username, String password) {
        User user = userRepository.findByUsername(username);
        if (user == null || !user.getPasswordHash().equals(hashPassword(password))) {
            throw new IllegalArgumentException("Invalid username or password");
        }
        Client client = clientRepository.findByUserId(user.getId());
        Employee employee = employeeRepository.findByUserId(user.getId());
        Long clientId = client == null ? null : client.getId();
        Long employeeId = employee == null ? null : employee.getId();
        EmployeeType employeeType = employee == null ? null : employee.getEmployeeType();
        Long officeId = (employee == null || employee.getOffice() == null) ? null : employee.getOffice().getId();
        return new AuthSession(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), clientId, employeeId, employeeType, officeId);
    }

    @Override
    public AuthSession registerClient(String username, String password, String email) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        String normalizedEmail = normalizeOptionalEmail(email);
        if (normalizedEmail != null && userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email already exists");
        }
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(hashPassword(password));
        user.setEmail(normalizedEmail);
        user.setFirstName(defaultFirstName(username));
        user.setLastName("User");
        user.setRole(Role.CLIENT);
        userRepository.save(user);

        Client client = new Client();
        client.setUser(user);
        clientRepository.save(client);

        return new AuthSession(user.getId(), user.getUsername(), user.getEmail(), Role.CLIENT, client.getId(), null, null, null);
    }

    private String defaultFirstName(String username) {
        if (username == null || username.isBlank()) return "User";
        return username.substring(0, 1).toUpperCase() + username.substring(1);
    }

    private String normalizeOptionalEmail(String email) {
        if (email == null || email.isBlank()) return null;
        return email.trim();
    }

    public static String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
