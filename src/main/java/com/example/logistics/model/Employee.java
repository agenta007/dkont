package com.example.logistics.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "employee")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "office_id")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Office office;

    @Enumerated(EnumType.STRING)
    @Column(name = "employee_type", nullable = false)
    private EmployeeType employeeType;

    @OneToMany(mappedBy = "registeredBy")
    @JsonIgnore
    private List<Shipment> registeredShipments;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Long getUserId() { return user == null ? null : user.getId(); }
    public String getFirstName() { return user == null ? null : user.getFirstName(); }
    public String getLastName() { return user == null ? null : user.getLastName(); }
    public String getEmail() { return user == null ? null : user.getEmail(); }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public Long getCompanyId() { return company == null ? null : company.getId(); }
    public Office getOffice() { return office; }
    public void setOffice(Office office) { this.office = office; }
    public Long getOfficeId() { return office == null ? null : office.getId(); }
    public EmployeeType getEmployeeType() { return employeeType; }
    public void setEmployeeType(EmployeeType employeeType) { this.employeeType = employeeType; }
    public List<Shipment> getRegisteredShipments() { return registeredShipments; }
    public void setRegisteredShipments(List<Shipment> registeredShipments) { this.registeredShipments = registeredShipments; }
}
