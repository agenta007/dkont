package com.example.logistics.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "office")
public class Office {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String city;

    private String phone;

    @OneToMany(mappedBy = "office")
    private List<Employee> employees;

    @OneToMany(mappedBy = "destinationOffice")
    private List<Shipment> incomingShipments;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public List<Employee> getEmployees() { return employees; }
    public void setEmployees(List<Employee> employees) { this.employees = employees; }
    public List<Shipment> getIncomingShipments() { return incomingShipments; }
    public void setIncomingShipments(List<Shipment> incomingShipments) { this.incomingShipments = incomingShipments; }
}