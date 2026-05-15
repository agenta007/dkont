package com.example.logistics.service.impl;

import com.example.logistics.model.Client;
import com.example.logistics.model.Employee;
import com.example.logistics.model.Role;
import com.example.logistics.model.User;
import com.example.logistics.repo.ClientRepository;
import com.example.logistics.repo.EmployeeRepository;
import com.example.logistics.repo.UserRepository;
import com.example.logistics.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getUsersByRole(Role role) {
        return userRepository.findByRole(role);
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) throw new IllegalArgumentException("User not found with id: " + id);
        return user;
    }

    @Override
    public User createUser(String username, String password, String email, String firstName, String lastName, Role role) {
        if (username == null || username.isBlank()) throw new IllegalArgumentException("Username is required");
        if (password == null || password.isBlank()) throw new IllegalArgumentException("Password is required");
        if (role == null) throw new IllegalArgumentException("Role is required");
        if (userRepository.existsByUsername(username)) throw new IllegalArgumentException("Username already exists");
        String normalizedEmail = normalizeOptionalEmail(email);
        if (normalizedEmail != null && userRepository.existsByEmail(normalizedEmail)) throw new IllegalArgumentException("Email already exists");

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(com.example.logistics.service.impl.AuthServiceImpl.hashPassword(password));
        user.setEmail(normalizedEmail);
        user.setFirstName(firstName == null || firstName.isBlank() ? defaultFirstName(username) : firstName);
        user.setLastName(lastName == null || lastName.isBlank() ? "User" : lastName);
        user.setRole(role);
        return userRepository.save(user);
    }

    private String normalizeOptionalEmail(String email) {
        if (email == null || email.isBlank()) return null;
        return email.trim();
    }

    private String defaultFirstName(String username) {
        if (username == null || username.isBlank()) return "User";
        return username.substring(0, 1).toUpperCase() + username.substring(1);
    }

    @Override
    public User changeUserRole(Long userId, Role role) {
        if (role == null) throw new IllegalArgumentException("Role is required");
        User user = getUserById(userId);
        user.setRole(role);
        return userRepository.save(user);
    }

    @Override
    public void deleteUser(Long userId) {
        User user = getUserById(userId);
        Client client = clientRepository.findByUserId(userId);
        if (client != null) clientRepository.delete(client);
        Employee employee = employeeRepository.findByUserId(userId);
        if (employee != null) employeeRepository.delete(employee);
        userRepository.delete(user);
    }
}
