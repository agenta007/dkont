package com.example.logistics.model;

public class Employee {
    private long id;
    private long userId;
    private long companyId;
    private long officeId;
    private String firstName;
    private String lastName;
    private EmployeeType employeeType;

    public Employee() {
    }

    public Employee(long id, long userId, long companyId, long officeId, String firstName, String lastName, EmployeeType employeeType) {
        this.id = id;
        this.userId = userId;
        this.companyId = companyId;
        this.officeId = officeId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.employeeType = employeeType;
    }

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }
    public long getUserId() { return userId; }
    public void setUserId(long userId) { this.userId = userId; }
    public long getCompanyId() { return companyId; }
    public void setCompanyId(long companyId) { this.companyId = companyId; }
    public long getOfficeId() { return officeId; }
    public void setOfficeId(long officeId) { this.officeId = officeId; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public EmployeeType getEmployeeType() { return employeeType; }
    public void setEmployeeType(EmployeeType employeeType) { this.employeeType = employeeType; }
}
