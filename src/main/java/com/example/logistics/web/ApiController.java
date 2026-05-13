package com.example.logistics.web;

import com.example.logistics.model.Client;
import com.example.logistics.model.Company;
import com.example.logistics.model.Employee;
import com.example.logistics.model.Office;
import com.example.logistics.model.Role;
import com.example.logistics.model.Shipment;
import com.example.logistics.service.LogisticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final LogisticsService service;

    public ApiController(LogisticsService service) {
        this.service = service;
    }

    @GetMapping("/snapshot")
    public LogisticsService.Snapshot snapshot() {
        return service.snapshot();
    }

    @PostMapping("/login")
    public LogisticsService.AuthSession login(@RequestBody LogisticsService.LoginRequest request) {
        return service.login(request.username(), request.password());
    }

    @PostMapping("/register")
    public LogisticsService.AuthSession register(@RequestBody LogisticsService.RegisterClientRequest request) {
        return service.registerClient(request);
    }

    @GetMapping("/shipments")
    public Object shipments(@RequestParam(defaultValue = "ADMIN") Role role, @RequestParam(required = false) Long clientId) {
        return service.shipmentsForRole(role, clientId);
    }

    @GetMapping("/reports")
    public LogisticsService.Reports reports(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.reports(from, to);
    }

    @PostMapping("/companies")
    public Company saveCompany(@RequestBody Company company) {
        return service.saveCompany(company);
    }

    @PostMapping("/offices")
    public Office saveOffice(@RequestBody Office office) {
        return service.saveOffice(office);
    }

    @PostMapping("/employees")
    public Employee saveEmployee(@RequestBody Employee employee) {
        return service.saveEmployee(employee);
    }

    @PostMapping("/clients")
    public Client saveClient(@RequestBody Client client) {
        return service.saveClient(client);
    }

    @PostMapping("/shipments")
    public Shipment saveShipment(@RequestBody Shipment shipment) {
        return service.saveShipment(shipment);
    }

    @PostMapping("/shipments/{id}/deliver")
    public Shipment deliver(@PathVariable long id) {
        return service.markDelivered(id);
    }

    @DeleteMapping("/{resource}/{id}")
    public ResponseEntity<Void> delete(@PathVariable String resource, @PathVariable long id) {
        service.delete(resource, id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> badRequest(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(exception.getMessage());
    }
}
