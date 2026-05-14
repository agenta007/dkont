package com.example.logistics.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
public class Shipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private long senderClientId;
    private long receiverClientId;
    private long registeredByEmployeeId;
    private Long courierId;
    private Long sourceOfficeId;
    private Long destinationOfficeId;
    private String deliveryAddress;
    private double weight;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryType deliveryType;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipmentStatus status;
    private LocalDate sentDate;
    private LocalDate receivedDate;

    public Shipment() {
    }

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }
    public long getSenderClientId() { return senderClientId; }
    public void setSenderClientId(long senderClientId) { this.senderClientId = senderClientId; }
    public long getReceiverClientId() { return receiverClientId; }
    public void setReceiverClientId(long receiverClientId) { this.receiverClientId = receiverClientId; }
    public long getRegisteredByEmployeeId() { return registeredByEmployeeId; }
    public void setRegisteredByEmployeeId(long registeredByEmployeeId) { this.registeredByEmployeeId = registeredByEmployeeId; }
    public Long getCourierId() { return courierId; }
    public void setCourierId(Long courierId) { this.courierId = courierId; }
    public Long getSourceOfficeId() { return sourceOfficeId; }
    public void setSourceOfficeId(Long sourceOfficeId) { this.sourceOfficeId = sourceOfficeId; }
    public Long getDestinationOfficeId() { return destinationOfficeId; }
    public void setDestinationOfficeId(Long destinationOfficeId) { this.destinationOfficeId = destinationOfficeId; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public double getWeight() { return weight; }
    public void setWeight(double weight) { this.weight = weight; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public DeliveryType getDeliveryType() { return deliveryType; }
    public void setDeliveryType(DeliveryType deliveryType) { this.deliveryType = deliveryType; }
    public ShipmentStatus getStatus() { return status; }
    public void setStatus(ShipmentStatus status) { this.status = status; }
    public LocalDate getSentDate() { return sentDate; }
    public void setSentDate(LocalDate sentDate) { this.sentDate = sentDate; }
    public LocalDate getReceivedDate() { return receivedDate; }
    public void setReceivedDate(LocalDate receivedDate) { this.receivedDate = receivedDate; }
}
