package com.example.logistics.service;

import com.example.logistics.model.Client;
import com.example.logistics.model.Company;
import com.example.logistics.model.DeliveryType;
import com.example.logistics.model.Employee;
import com.example.logistics.model.EmployeeType;
import com.example.logistics.model.Office;
import com.example.logistics.model.Role;
import com.example.logistics.model.Shipment;
import com.example.logistics.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class LogisticsService {
    private final UserAccountService accounts;
    private final CatalogService catalog;
    private final ShipmentWorkflowService shipmentWorkflow;
    private final ReportService reports;

    public LogisticsService(
            UserAccountService accounts,
            CatalogService catalog,
            ShipmentWorkflowService shipmentWorkflow,
            ReportService reports) {
        this.accounts = accounts;
        this.catalog = catalog;
        this.shipmentWorkflow = shipmentWorkflow;
        this.reports = reports;
    }

    @Transactional(readOnly = true)
    public Snapshot snapshot() {
        return catalog.snapshot();
    }

    @Transactional(readOnly = true)
    public AuthSession login(String username, String password) {
        return accounts.login(username, password);
    }

    public AuthSession registerClient(RegisterClientRequest request) {
        return accounts.registerClient(request);
    }

    @Transactional(readOnly = true)
    public List<User> users() {
        return accounts.users();
    }

    public User createUser(String username, String password, String email, Role role) {
        return accounts.createUser(username, password, email, role);
    }

    public User changeUserRole(String username, Role role) {
        return accounts.changeUserRole(username, role);
    }

    public User removeUser(String username) {
        return accounts.removeUser(username);
    }

    public Company saveCompany(Company company) {
        return catalog.saveCompany(company);
    }

    public Office saveOffice(Office office) {
        return catalog.saveOffice(office);
    }

    public Employee saveEmployee(Employee employee) {
        return catalog.saveEmployee(employee);
    }

    public Client saveClient(Client client) {
        return catalog.saveClient(client);
    }

    public Shipment saveShipment(Shipment shipment) {
        return shipmentWorkflow.saveShipment(shipment);
    }

    public void delete(String resource, long id) {
        catalog.delete(resource, id);
    }

    public Shipment markDelivered(long id) {
        return shipmentWorkflow.markDelivered(id);
    }

    @Transactional(readOnly = true)
    public List<Shipment> shipmentsForRole(Role role, Long clientId) {
        return shipmentWorkflow.shipmentsForRole(role, clientId);
    }

    @Transactional(readOnly = true)
    public Reports reports(LocalDate from, LocalDate to) {
        return reports.reports(from, to);
    }

    public BigDecimal calculatePrice(double weight, DeliveryType deliveryType) {
        return shipmentWorkflow.calculatePrice(weight, deliveryType);
    }

    public record Snapshot(List<User> users, List<Company> companies, List<Employee> employees, List<Client> clients, List<Office> offices, List<Shipment> shipments) {
    }

    public record Reports(List<Employee> employees, List<Client> clients, List<Shipment> shipments, List<Shipment> openShipments, LocalDate from, LocalDate to, BigDecimal revenue) {
    }

    public record LoginRequest(String username, String password) {
    }

    public record RegisterClientRequest(String username, String password, String email, String firstName, String lastName, String phone, String address) {
    }

    public record AuthSession(long userId, String username, String email, Role role, Long clientId, Long employeeId, EmployeeType employeeType, Long officeId) {
    }
}
