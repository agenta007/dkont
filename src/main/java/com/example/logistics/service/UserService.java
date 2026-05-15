package com.example.logistics.service;

import com.example.logistics.model.Role;
import com.example.logistics.model.User;

import java.util.List;

public interface UserService {
    List<User> getAllUsers();
    List<User> getUsersByRole(Role role);
    User getUserById(Long id);
    User createUser(String username, String password, String email, String firstName, String lastName, Role role);
    User changeUserRole(Long userId, Role role);
    void deleteUser(Long userId);
}
