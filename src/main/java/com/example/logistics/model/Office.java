package com.example.logistics.model;

public class Office {
    private long id;
    private long companyId;
    private String name;
    private String city;
    private String address;
    private String phone;

    public Office() {
    }

    public Office(long id, long companyId, String name, String city, String address, String phone) {
        this.id = id;
        this.companyId = companyId;
        this.name = name;
        this.city = city;
        this.address = address;
        this.phone = phone;
    }

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }
    public long getCompanyId() { return companyId; }
    public void setCompanyId(long companyId) { this.companyId = companyId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
