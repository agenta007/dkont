package com.example.logistics.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "client")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @OneToMany(mappedBy = "sender")
    private List<Shipment> sentShipments;

    @OneToMany(mappedBy = "recipient")
    private List<Shipment> receivedShipments;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public List<Shipment> getSentShipments() { return sentShipments; }
    public void setSentShipments(List<Shipment> sentShipments) { this.sentShipments = sentShipments; }
    public List<Shipment> getReceivedShipments() { return receivedShipments; }
    public void setReceivedShipments(List<Shipment> receivedShipments) { this.receivedShipments = receivedShipments; }
}