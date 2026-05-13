package com.example.logistics.service;

import com.example.logistics.model.Client;
import com.example.logistics.model.Company;
import com.example.logistics.model.DeliveryType;
import com.example.logistics.model.Employee;
import com.example.logistics.model.EmployeeType;
import com.example.logistics.model.Office;
import com.example.logistics.model.Role;
import com.example.logistics.model.Shipment;
import com.example.logistics.model.ShipmentStatus;
import com.example.logistics.model.User;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Stream;

@Service
public class LogisticsService {
    private final Map<Long, User> users = new LinkedHashMap<>();
    private final Map<Long, Company> companies = new LinkedHashMap<>();
    private final Map<Long, Employee> employees = new LinkedHashMap<>();
    private final Map<Long, Client> clients = new LinkedHashMap<>();
    private final Map<Long, Office> offices = new LinkedHashMap<>();
    private final Map<Long, Shipment> shipments = new LinkedHashMap<>();

    private final AtomicLong userIds = new AtomicLong();
    private final AtomicLong companyIds = new AtomicLong();
    private final AtomicLong employeeIds = new AtomicLong();
    private final AtomicLong clientIds = new AtomicLong();
    private final AtomicLong officeIds = new AtomicLong();
    private final AtomicLong shipmentIds = new AtomicLong();

    public LogisticsService() {
        seed();
    }

    public synchronized Snapshot snapshot() {
        return new Snapshot(
                list(users),
                list(companies),
                list(employees),
                list(clients),
                list(offices),
                list(shipments)
        );
    }

    public synchronized AuthSession login(String username, String password) {
        User user = users.values().stream()
                .filter(candidate -> candidate.getUsername().equalsIgnoreCase(username))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));
        if (!user.getPassword().equals(hashPassword(password))) {
            throw new IllegalArgumentException("Invalid username or password");
        }
        Long clientId = clients.values().stream()
                .filter(client -> client.getUserId() == user.getId())
                .map(Client::getId)
                .findFirst()
                .orElse(null);
        return new AuthSession(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), clientId);
    }

    public synchronized AuthSession registerClient(RegisterClientRequest request) {
        boolean exists = users.values().stream().anyMatch(user -> user.getUsername().equalsIgnoreCase(request.username()));
        if (exists) {
            throw new IllegalArgumentException("Username already exists");
        }
        User user = addUser(request.username(), request.password(), request.email(), Role.CLIENT);
        Client client = saveClient(new Client(0, user.getId(), request.firstName(), request.lastName(), request.phone(), request.email(), request.address()));
        return new AuthSession(user.getId(), user.getUsername(), user.getEmail(), Role.CLIENT, client.getId());
    }

    public synchronized Company saveCompany(Company company) {
        if (company.getId() == 0) {
            company.setId(companyIds.incrementAndGet());
        }
        companies.put(company.getId(), company);
        return company;
    }

    public synchronized Office saveOffice(Office office) {
        if (office.getId() == 0) {
            office.setId(officeIds.incrementAndGet());
        }
        offices.put(office.getId(), office);
        return office;
    }

    public synchronized Employee saveEmployee(Employee employee) {
        if (employee.getId() == 0) {
            employee.setId(employeeIds.incrementAndGet());
        }
        employees.put(employee.getId(), employee);
        return employee;
    }

    public synchronized Client saveClient(Client client) {
        if (client.getId() == 0) {
            client.setId(clientIds.incrementAndGet());
        }
        clients.put(client.getId(), client);
        return client;
    }

    public synchronized Shipment saveShipment(Shipment shipment) {
        if (shipment.getId() == 0) {
            shipment.setId(shipmentIds.incrementAndGet());
            if (shipment.getSentDate() == null) {
                shipment.setSentDate(LocalDate.now());
            }
        }
        if (shipment.getStatus() == null) {
            shipment.setStatus(ShipmentStatus.REGISTERED);
        }
        shipment.setPrice(calculatePrice(shipment.getWeight(), shipment.getDeliveryType()));
        if (shipment.getStatus() == ShipmentStatus.DELIVERED && shipment.getReceivedDate() == null) {
            shipment.setReceivedDate(LocalDate.now());
        }
        shipments.put(shipment.getId(), shipment);
        return shipment;
    }

    public synchronized void delete(String resource, long id) {
        switch (resource) {
            case "companies" -> companies.remove(id);
            case "offices" -> offices.remove(id);
            case "employees" -> employees.remove(id);
            case "clients" -> clients.remove(id);
            case "shipments" -> shipments.remove(id);
            default -> throw new IllegalArgumentException("Unknown resource: " + resource);
        }
    }

    public synchronized Shipment markDelivered(long id) {
        Shipment shipment = shipments.get(id);
        if (shipment == null) {
            throw new NoSuchElementException("Shipment not found");
        }
        shipment.setStatus(ShipmentStatus.DELIVERED);
        shipment.setReceivedDate(LocalDate.now());
        return shipment;
    }

    public synchronized List<Shipment> shipmentsForRole(Role role, Long clientId) {
        Stream<Shipment> stream = shipments.values().stream();
        if (role == Role.CLIENT && clientId != null) {
            stream = stream.filter(shipment -> shipment.getSenderClientId() == clientId || shipment.getReceiverClientId() == clientId);
        }
        return stream.sorted(Comparator.comparing(Shipment::getId)).toList();
    }

    public synchronized Reports reports(LocalDate from, LocalDate to) {
        LocalDate start = from == null ? LocalDate.now().minusMonths(1) : from;
        LocalDate end = to == null ? LocalDate.now() : to;
        List<Shipment> periodShipments = shipments.values().stream()
                .filter(shipment -> shipment.getSentDate() != null)
                .filter(shipment -> !shipment.getSentDate().isBefore(start) && !shipment.getSentDate().isAfter(end))
                .toList();
        BigDecimal revenue = periodShipments.stream()
                .map(Shipment::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<Shipment> open = shipments.values().stream()
                .filter(shipment -> shipment.getStatus() != ShipmentStatus.DELIVERED && shipment.getStatus() != ShipmentStatus.CANCELLED)
                .sorted(Comparator.comparing(Shipment::getId))
                .toList();
        return new Reports(list(employees), list(clients), list(shipments), open, start, end, revenue);
    }

    public BigDecimal calculatePrice(double weight, DeliveryType deliveryType) {
        BigDecimal price = BigDecimal.valueOf(5).add(BigDecimal.valueOf(weight).multiply(BigDecimal.valueOf(2)));
        if (deliveryType == DeliveryType.TO_ADDRESS) {
            price = price.add(BigDecimal.valueOf(5));
        }
        return price;
    }

    private <T> List<T> list(Map<Long, T> map) {
        return new ArrayList<>(map.values());
    }

    private void seed() {
        Company company = saveCompany(new Company(0, "Dkont", "Sofia, 12 Shipka St.", "+359 2 555 0101", "office@dkont.example"));

        Office sofia = saveOffice(new Office(0, company.getId(), "Central Office", "Sofia", "12 Shipka St.", "+359 2 555 0102"));
        Office plovdiv = saveOffice(new Office(0, company.getId(), "South Office", "Plovdiv", "44 Maritsa Blvd.", "+359 32 555 010"));
        Office varna = saveOffice(new Office(0, company.getId(), "Sea Office", "Varna", "8 Primorski Blvd.", "+359 52 555 010"));

        User admin = addUser("admin", "admin", "admin@example.test", Role.ADMIN);
        User officeUser = addUser("elena", "demo", "elena@example.test", Role.EMPLOYEE);
        User courierUser = addUser("nikolay", "demo", "nikolay@example.test", Role.EMPLOYEE);
        User clientOneUser = addUser("maria", "demo", "maria@example.test", Role.CLIENT);
        User clientTwoUser = addUser("ivan", "demo", "ivan@example.test", Role.CLIENT);
        User clientThreeUser = addUser("stella", "demo", "stella@example.test", Role.CLIENT);

        saveEmployee(new Employee(0, admin.getId(), company.getId(), sofia.getId(), "Admin", "User", EmployeeType.OFFICE_EMPLOYEE));
        Employee officeEmployee = saveEmployee(new Employee(0, officeUser.getId(), company.getId(), sofia.getId(), "Elena", "Petrova", EmployeeType.OFFICE_EMPLOYEE));
        Employee courier = saveEmployee(new Employee(0, courierUser.getId(), company.getId(), plovdiv.getId(), "Nikolay", "Georgiev", EmployeeType.COURIER));

        Client maria = saveClient(new Client(0, clientOneUser.getId(), "Maria", "Dimitrova", "+359 88 111 222", "maria@example.test", "Sofia, 4 Vitosha Blvd."));
        Client ivan = saveClient(new Client(0, clientTwoUser.getId(), "Ivan", "Kolev", "+359 89 333 444", "ivan@example.test", "Plovdiv, 9 Central Sq."));
        Client stella = saveClient(new Client(0, clientThreeUser.getId(), "Stella", "Nikolova", "+359 87 555 666", "stella@example.test", "Varna, 18 Sea Garden"));

        Shipment first = shipment(maria.getId(), ivan.getId(), officeEmployee.getId(), courier.getId(), sofia.getId(), plovdiv.getId(), null, 2.5, DeliveryType.TO_OFFICE, ShipmentStatus.IN_TRANSIT, LocalDate.now().minusDays(3), null);
        Shipment second = shipment(ivan.getId(), maria.getId(), officeEmployee.getId(), courier.getId(), plovdiv.getId(), null, maria.getAddress(), 1.2, DeliveryType.TO_ADDRESS, ShipmentStatus.DELIVERED, LocalDate.now().minusDays(8), LocalDate.now().minusDays(6));
        Shipment third = shipment(stella.getId(), maria.getId(), officeEmployee.getId(), courier.getId(), varna.getId(), sofia.getId(), null, 5.0, DeliveryType.TO_OFFICE, ShipmentStatus.REGISTERED, LocalDate.now().minusDays(1), null);
        saveShipment(first);
        saveShipment(second);
        saveShipment(third);
    }

    private User addUser(String username, String password, String email, Role role) {
        User user = new User(userIds.incrementAndGet(), username, hashPassword(password), email, role, LocalDateTime.now());
        users.put(user.getId(), user);
        return user;
    }

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte item : hash) {
                builder.append(String.format("%02x", item));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    private Shipment shipment(long senderClientId, long receiverClientId, long registeredByEmployeeId, long courierId, Long sourceOfficeId, Long destinationOfficeId, String deliveryAddress, double weight, DeliveryType deliveryType, ShipmentStatus status, LocalDate sentDate, LocalDate receivedDate) {
        Shipment shipment = new Shipment();
        shipment.setSenderClientId(senderClientId);
        shipment.setReceiverClientId(receiverClientId);
        shipment.setRegisteredByEmployeeId(registeredByEmployeeId);
        shipment.setCourierId(courierId);
        shipment.setSourceOfficeId(sourceOfficeId);
        shipment.setDestinationOfficeId(destinationOfficeId);
        shipment.setDeliveryAddress(deliveryAddress);
        shipment.setWeight(weight);
        shipment.setDeliveryType(deliveryType);
        shipment.setStatus(status);
        shipment.setSentDate(sentDate);
        shipment.setReceivedDate(receivedDate);
        return shipment;
    }

    public record Snapshot(List<User> users, List<Company> companies, List<Employee> employees, List<Client> clients, List<Office> offices, List<Shipment> shipments) {
    }

    public record Reports(List<Employee> employees, List<Client> clients, List<Shipment> shipments, List<Shipment> openShipments, LocalDate from, LocalDate to, BigDecimal revenue) {
    }

    public record LoginRequest(String username, String password) {
    }

    public record RegisterClientRequest(String username, String password, String email, String firstName, String lastName, String phone, String address) {
    }

    public record AuthSession(long userId, String username, String email, Role role, Long clientId) {
    }
}
