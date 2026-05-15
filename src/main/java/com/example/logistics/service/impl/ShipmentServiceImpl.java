package com.example.logistics.service.impl;

import com.example.logistics.model.DeliveryType;
import com.example.logistics.model.Shipment;
import com.example.logistics.model.ShipmentStatus;
import com.example.logistics.repo.ShipmentRepository;
import com.example.logistics.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ShipmentServiceImpl implements ShipmentService {

    private final ShipmentRepository shipmentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Shipment> getAllShipments() {
        return shipmentRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Shipment> getShipmentsBySender(Long clientId) {
        return shipmentRepository.findBySenderId(clientId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Shipment> getShipmentsByRecipient(Long clientId) {
        return shipmentRepository.findByRecipientId(clientId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Shipment> getShipmentsByClient(Long clientId) {
        return shipmentRepository.findAllByClientId(clientId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Shipment> getShipmentsByEmployee(Long employeeId) {
        return shipmentRepository.findByRegisteredById(employeeId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Shipment> getUndeliveredShipments() {
        return shipmentRepository.findByStatusNot(ShipmentStatus.DELIVERED)
                .stream()
                .filter(s -> s.getStatus() != ShipmentStatus.CANCELLED)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Shipment getShipmentById(Long id) {
        Shipment shipment = shipmentRepository.findById(id).orElse(null);
        if (shipment == null) throw new IllegalArgumentException("Shipment not found with id: " + id);
        return shipment;
    }

    @Override
    public Shipment createShipment(Shipment shipment) {
        if (shipment.getSender() == null) throw new IllegalArgumentException("Sender is required");
        if (shipment.getRecipient() == null) throw new IllegalArgumentException("Recipient is required");
        if (shipment.getRegisteredBy() == null) throw new IllegalArgumentException("Registering employee is required");
        if (shipment.getWeight() == null) throw new IllegalArgumentException("Weight is required");
        if (shipment.getDeliveryType() == null) throw new IllegalArgumentException("Delivery type is required");
        if (shipment.getDeliveryType() == DeliveryType.TO_ADDRESS && (shipment.getDeliveryAddress() == null || shipment.getDeliveryAddress().isBlank())) {
            throw new IllegalArgumentException("Delivery address is required for TO_ADDRESS shipments");
        }
        if (shipment.getDeliveryType() == DeliveryType.TO_OFFICE && shipment.getDestinationOffice() == null) {
            throw new IllegalArgumentException("Destination office is required for TO_OFFICE shipments");
        }
        shipment.setPrice(calculatePrice(shipment));
        return shipmentRepository.save(shipment);
    }

    @Override
    public Shipment updateShipment(Long id, Shipment updated) {
        Shipment existing = getShipmentById(id);
        existing.setSender(updated.getSender());
        existing.setRecipient(updated.getRecipient());
        existing.setDeliveryType(updated.getDeliveryType());
        existing.setDeliveryAddress(updated.getDeliveryAddress());
        existing.setDestinationOffice(updated.getDestinationOffice());
        existing.setWeight(updated.getWeight());
        existing.setPrice(calculatePrice(existing));
        return shipmentRepository.save(existing);
    }

    @Override
    public Shipment markDelivered(Long id) {
        Shipment shipment = getShipmentById(id);
        shipment.setStatus(ShipmentStatus.DELIVERED);
        shipment.setDeliveredAt(LocalDateTime.now());
        return shipmentRepository.save(shipment);
    }

    @Override
    public Shipment markInTransit(Long id) {
        Shipment shipment = getShipmentById(id);
        shipment.setStatus(ShipmentStatus.IN_TRANSIT);
        return shipmentRepository.save(shipment);
    }

    @Override
    public Shipment cancelShipment(Long id) {
        Shipment shipment = getShipmentById(id);
        shipment.setStatus(ShipmentStatus.CANCELLED);
        return shipmentRepository.save(shipment);
    }

    @Override
    public void deleteShipment(Long id) {
        shipmentRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateRevenue(Long companyId, LocalDateTime from, LocalDateTime to) {
        return shipmentRepository.calculateRevenue(companyId, from, to);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Shipment> getShipmentsByDateRange(Long companyId, LocalDateTime from, LocalDateTime to) {
        return shipmentRepository.findByCompanyIdAndDateRange(companyId, from, to);
    }

    private BigDecimal calculatePrice(Shipment shipment) {
        BigDecimal price = shipment.getCompany().getBasePricePerKg().multiply(shipment.getWeight());
        if (shipment.getDeliveryType() == DeliveryType.TO_ADDRESS) {
            price = price.add(shipment.getCompany().getAddressSurcharge());
        }
        return price;
    }
}