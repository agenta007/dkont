package com.example.logistics.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public class Shipment {
    private long id;
    private long senderClientId;
    private long receiverClientId;
    private long registeredByEmployeeId;
    private Long courierId;
    private Long sourceOfficeId;
    private Long destinationOfficeId;
    private String deliveryAddress;
    private double weight;
    private BigDecimal price;
    private DeliveryType deliveryType;
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
