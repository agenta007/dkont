package com.example.logistics.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "company")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "base_price_per_kg", nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal basePricePerKg;

    @Column(name = "address_surcharge", nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal addressSurcharge;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    private List<Office> offices;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    private List<Employee> employees;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    private List<Shipment> shipments;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public java.math.BigDecimal getBasePricePerKg() { return basePricePerKg; }
    public void setBasePricePerKg(java.math.BigDecimal basePricePerKg) { this.basePricePerKg = basePricePerKg; }
    public java.math.BigDecimal getAddressSurcharge() { return addressSurcharge; }
    public void setAddressSurcharge(java.math.BigDecimal addressSurcharge) { this.addressSurcharge = addressSurcharge; }
    public List<Office> getOffices() { return offices; }
    public void setOffices(List<Office> offices) { this.offices = offices; }
    public List<Employee> getEmployees() { return employees; }
    public void setEmployees(List<Employee> employees) { this.employees = employees; }
    public List<Shipment> getShipments() { return shipments; }
    public void setShipments(List<Shipment> shipments) { this.shipments = shipments; }
}
