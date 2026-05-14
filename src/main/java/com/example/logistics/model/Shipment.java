package com.example.logistics.model;

import jakarta.persistence.*;

@Entity
@Table(name = "shipment")
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private Client sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private Client recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registered_by_id", nullable = false)
    private Employee registeredBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_type", nullable = false)
    private DeliveryType deliveryType;

    @Column(name = "delivery_address")
    private String deliveryAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_office_id")
    private Office destinationOffice;

    @Column(nullable = false, precision = 10, scale = 3)
    private java.math.BigDecimal weight;

    @Column(nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipmentStatus status;

    @Column(name = "registered_at", nullable = false, updatable = false)
    private java.time.LocalDateTime registeredAt;

    @Column(name = "delivered_at")
    private java.time.LocalDateTime deliveredAt;

    @PrePersist
    protected void onCreate() {
        this.registeredAt = java.time.LocalDateTime.now();
        this.status = ShipmentStatus.REGISTERED;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public Client getSender() { return sender; }
    public void setSender(Client sender) { this.sender = sender; }
    public Client getRecipient() { return recipient; }
    public void setRecipient(Client recipient) { this.recipient = recipient; }
    public Employee getRegisteredBy() { return registeredBy; }
    public void setRegisteredBy(Employee registeredBy) { this.registeredBy = registeredBy; }
    public DeliveryType getDeliveryType() { return deliveryType; }
    public void setDeliveryType(DeliveryType deliveryType) { this.deliveryType = deliveryType; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public Office getDestinationOffice() { return destinationOffice; }
    public void setDestinationOffice(Office destinationOffice) { this.destinationOffice = destinationOffice; }
    public java.math.BigDecimal getWeight() { return weight; }
    public void setWeight(java.math.BigDecimal weight) { this.weight = weight; }
    public java.math.BigDecimal getPrice() { return price; }
    public void setPrice(java.math.BigDecimal price) { this.price = price; }
    public ShipmentStatus getStatus() { return status; }
    public void setStatus(ShipmentStatus status) { this.status = status; }
    public java.time.LocalDateTime getRegisteredAt() { return registeredAt; }
    public java.time.LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(java.time.LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }
}
