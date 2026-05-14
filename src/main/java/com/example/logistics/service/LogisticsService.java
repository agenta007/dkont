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
import com.example.logistics.repository.ClientRepository;
import com.example.logistics.repository.CompanyRepository;
import com.example.logistics.repository.EmployeeRepository;
import com.example.logistics.repository.OfficeRepository;
import com.example.logistics.repository.ShipmentRepository;
import com.example.logistics.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Stream;

@Service
@Transactional
public class LogisticsService {
    private final UserRepository users;
    private final CompanyRepository companies;
    private final EmployeeRepository employees;
    private final ClientRepository clients;
    private final OfficeRepository offices;
    private final ShipmentRepository shipments;
    private final String seedAdminUsername;
    private final String seedAdminPassword;

    public LogisticsService(
            UserRepository users,
            CompanyRepository companies,
            EmployeeRepository employees,
            ClientRepository clients,
            OfficeRepository offices,
            ShipmentRepository shipments,
            @Value("${admin.seed.username:admin}") String seedAdminUsername,
            @Value("${admin.seed.password:admin}") String seedAdminPassword) {
        this.users = users;
        this.companies = companies;
        this.employees = employees;
        this.clients = clients;
        this.offices = offices;
        this.shipments = shipments;
        this.seedAdminUsername = seedAdminUsername;
        this.seedAdminPassword = seedAdminPassword;
    }

    @PostConstruct
    public void seedIfEmpty() {
        if (companies.count() == 0 && users.count() == 0) {
            seed();
        }
    }

    @Transactional(readOnly = true)
    public Snapshot snapshot() {
        return new Snapshot(
                users(),
                sorted(companies.findAll()),
                sorted(employees.findAll()),
                sorted(clients.findAll()),
                sorted(offices.findAll()),
                sorted(shipments.findAll())
        );
    }

    @Transactional(readOnly = true)
    public AuthSession login(String username, String password) {
        User user = users.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));
        if (!user.getPassword().equals(hashPassword(password))) {
            throw new IllegalArgumentException("Invalid username or password");
        }
        Long clientId = clients.findByUserId(user.getId())
                .map(Client::getId)
                .orElse(null);
        Employee employee = employees.findByUserId(user.getId()).orElse(null);
        Long employeeId = employee == null ? null : employee.getId();
        EmployeeType employeeType = employee == null ? null : employee.getEmployeeType();
        Long officeId = employee == null ? null : employee.getOfficeId();
        return new AuthSession(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), clientId, employeeId, employeeType, officeId);
    }

    public AuthSession registerClient(RegisterClientRequest request) {
        if (users.existsByUsernameIgnoreCase(request.username())) {
            throw new IllegalArgumentException("Username already exists");
        }
        User user = addUser(request.username(), request.password(), request.email(), Role.CLIENT);
        long companyId = companies.findAll().stream().findFirst().map(Company::getId).orElse(0L);
        Client client = saveClient(new Client(0, user.getId(), companyId, request.firstName(), request.lastName(), request.phone(), request.email(), request.address()));
        return new AuthSession(user.getId(), user.getUsername(), user.getEmail(), Role.CLIENT, client.getId(), null, null, null);
    }

    @Transactional(readOnly = true)
    public List<User> users() {
        return sorted(users.findAll());
    }

    public User createUser(String username, String password, String email, Role role) {
        requireText(username, "Username is required");
        requireText(password, "Password is required");
        requireText(email, "Email is required");
        if (role == null) {
            throw new IllegalArgumentException("Role is required");
        }
        if (users.existsByUsernameIgnoreCase(username)) {
            throw new IllegalArgumentException("Username already exists: " + username);
        }
        return addUser(username, password, email, role);
    }

    public User changeUserRole(String username, Role role) {
        if (role == null) {
            throw new IllegalArgumentException("Role is required");
        }
        User user = findUser(username);
        user.setRole(role);
        return users.save(user);
    }

    public User removeUser(String username) {
        User user = findUser(username);
        clients.deleteByUserId(user.getId());
        employees.deleteByUserId(user.getId());
        users.delete(user);
        return user;
    }

    public Company saveCompany(Company company) {
        return companies.save(company);
    }

    public Office saveOffice(Office office) {
        return offices.save(office);
    }

    public Employee saveEmployee(Employee employee) {
        if (employee.getUserId() == 0) {
            String username = employeeUsername(employee);
            User user = addUniqueUser(username, "demo", username + "@example.test", Role.EMPLOYEE);
            employee.setUserId(user.getId());
        }
        return employees.save(employee);
    }

    public Client saveClient(Client client) {
        if (client.getCompanyId() == 0) {
            companies.findAll().stream().findFirst().ifPresent(company -> client.setCompanyId(company.getId()));
        }
        return clients.save(client);
    }

    public Shipment saveShipment(Shipment shipment) {
        if (shipment.getId() == 0 && shipment.getSentDate() == null) {
            shipment.setSentDate(LocalDate.now());
        }
        if (shipment.getStatus() == null) {
            shipment.setStatus(ShipmentStatus.REGISTERED);
        }
        shipment.setPrice(calculatePrice(shipment.getWeight(), shipment.getDeliveryType()));
        if (shipment.getStatus() == ShipmentStatus.DELIVERED && shipment.getReceivedDate() == null) {
            shipment.setReceivedDate(LocalDate.now());
        }
        return shipments.save(shipment);
    }

    public void delete(String resource, long id) {
        switch (resource) {
            case "companies" -> companies.deleteById(id);
            case "offices" -> offices.deleteById(id);
            case "employees" -> employees.deleteById(id);
            case "clients" -> clients.deleteById(id);
            case "shipments" -> shipments.deleteById(id);
            default -> throw new IllegalArgumentException("Unknown resource: " + resource);
        }
    }

    public Shipment markDelivered(long id) {
        Shipment shipment = shipments.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Shipment not found"));
        shipment.setStatus(ShipmentStatus.DELIVERED);
        shipment.setReceivedDate(LocalDate.now());
        return shipments.save(shipment);
    }

    @Transactional(readOnly = true)
    public List<Shipment> shipmentsForRole(Role role, Long clientId) {
        Stream<Shipment> stream = shipments.findAll().stream();
        if (role == Role.CLIENT && clientId != null) {
            stream = stream.filter(shipment -> shipment.getSenderClientId() == clientId || shipment.getReceiverClientId() == clientId);
        }
        return stream.sorted(Comparator.comparing(Shipment::getId)).toList();
    }

    @Transactional(readOnly = true)
    public Reports reports(LocalDate from, LocalDate to) {
        LocalDate start = from == null ? LocalDate.now().minusMonths(1) : from;
        LocalDate end = to == null ? LocalDate.now() : to;
        List<Shipment> periodShipments = shipments.findBySentDateBetween(start, end);
        BigDecimal revenue = periodShipments.stream()
                .map(Shipment::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<Shipment> open = shipments.findAll().stream()
                .filter(shipment -> shipment.getStatus() != ShipmentStatus.DELIVERED && shipment.getStatus() != ShipmentStatus.CANCELLED)
                .sorted(Comparator.comparing(Shipment::getId))
                .toList();
        return new Reports(sorted(employees.findAll()), sorted(clients.findAll()), sorted(shipments.findAll()), open, start, end, revenue);
    }

    public BigDecimal calculatePrice(double weight, DeliveryType deliveryType) {
        BigDecimal price = BigDecimal.valueOf(5).add(BigDecimal.valueOf(weight).multiply(BigDecimal.valueOf(2)));
        if (deliveryType == DeliveryType.TO_ADDRESS) {
            price = price.add(BigDecimal.valueOf(5));
        }
        return price;
    }

    private void seed() {
        Company company = saveCompany(new Company(0, "Dkont", "Sofia, 12 Shipka St.", "+359 2 555 0101", "office@dkont.example"));

        Office sofia = saveOffice(new Office(0, company.getId(), "Central Office", "Sofia", "12 Shipka St.", "+359 2 555 0102"));
        Office plovdiv = saveOffice(new Office(0, company.getId(), "South Office", "Plovdiv", "44 Maritsa Blvd.", "+359 32 555 010"));
        Office varna = saveOffice(new Office(0, company.getId(), "Sea Office", "Varna", "8 Primorski Blvd.", "+359 52 555 010"));

        User admin = addUser(seedAdminUsername, seedAdminPassword, "admin@example.test", Role.ADMIN);
        User officeUser = addUser("elena", "demo", "elena@example.test", Role.EMPLOYEE);
        User courierUser = addUser("nikolay", "demo", "nikolay@example.test", Role.EMPLOYEE);
        User clientOneUser = addUser("maria", "demo", "maria@example.test", Role.CLIENT);
        User clientTwoUser = addUser("ivan", "demo", "ivan@example.test", Role.CLIENT);
        User clientThreeUser = addUser("stella", "demo", "stella@example.test", Role.CLIENT);

        saveEmployee(new Employee(0, admin.getId(), company.getId(), sofia.getId(), "Admin", "User", EmployeeType.OFFICE_EMPLOYEE));
        Employee officeEmployee = saveEmployee(new Employee(0, officeUser.getId(), company.getId(), sofia.getId(), "Elena", "Petrova", EmployeeType.OFFICE_EMPLOYEE));
        Employee courier = saveEmployee(new Employee(0, courierUser.getId(), company.getId(), plovdiv.getId(), "Nikolay", "Georgiev", EmployeeType.COURIER));

        Client maria = saveClient(new Client(0, clientOneUser.getId(), company.getId(), "Maria", "Dimitrova", "+359 88 111 222", "maria@example.test", "Sofia, 4 Vitosha Blvd."));
        Client ivan = saveClient(new Client(0, clientTwoUser.getId(), company.getId(), "Ivan", "Kolev", "+359 89 333 444", "ivan@example.test", "Plovdiv, 9 Central Sq."));
        Client stella = saveClient(new Client(0, clientThreeUser.getId(), company.getId(), "Stella", "Nikolova", "+359 87 555 666", "stella@example.test", "Varna, 18 Sea Garden"));

        Shipment first = shipment(maria.getId(), ivan.getId(), officeEmployee.getId(), courier.getId(), sofia.getId(), plovdiv.getId(), null, 2.5, DeliveryType.TO_OFFICE, ShipmentStatus.IN_TRANSIT, LocalDate.now().minusDays(3), null);
        Shipment second = shipment(ivan.getId(), maria.getId(), officeEmployee.getId(), courier.getId(), plovdiv.getId(), null, maria.getAddress(), 1.2, DeliveryType.TO_ADDRESS, ShipmentStatus.DELIVERED, LocalDate.now().minusDays(8), LocalDate.now().minusDays(6));
        Shipment third = shipment(stella.getId(), maria.getId(), officeEmployee.getId(), courier.getId(), varna.getId(), sofia.getId(), null, 5.0, DeliveryType.TO_OFFICE, ShipmentStatus.REGISTERED, LocalDate.now().minusDays(1), null);
        saveShipment(first);
        saveShipment(second);
        saveShipment(third);
    }

    private User findUser(String username) {
        requireText(username, "Username is required");
        return users.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }

    private User addUser(String username, String password, String email, Role role) {
        User user = new User(0, username, hashPassword(password), email, role, LocalDateTime.now());
        return users.save(user);
    }

    private User addUniqueUser(String username, String password, String email, Role role) {
        String candidate = username;
        int suffix = 1;
        while (users.existsByUsernameIgnoreCase(candidate)) {
            candidate = username + suffix;
            suffix++;
        }
        return addUser(candidate, password, candidate.equals(username) ? email : candidate + "@example.test", role);
    }

    private String employeeUsername(Employee employee) {
        String base = (employee.getFirstName() + "." + employee.getLastName())
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", ".");
        base = base.replaceAll("^\\.+|\\.+$", "");
        return base.isBlank() ? "employee" : base;
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

    private <T> List<T> sorted(List<T> items) {
        return items.stream()
                .sorted(Comparator.comparing(item -> ((Number) readId(item)).longValue()))
                .toList();
    }

    private Object readId(Object item) {
        try {
            return item.getClass().getMethod("getId").invoke(item);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException("Could not read id from " + item.getClass().getName(), exception);
        }
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
