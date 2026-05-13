package com.example.logistics;

import com.example.logistics.model.DeliveryType;
import com.example.logistics.service.LogisticsService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class LogisticsServiceTest {
    private final LogisticsService service = new LogisticsService();

    @Test
    void calculatesOfficeDeliveryPrice() {
        assertThat(service.calculatePrice(2.5, DeliveryType.TO_OFFICE)).isEqualByComparingTo(BigDecimal.valueOf(10.0));
    }

    @Test
    void calculatesAddressDeliveryPrice() {
        assertThat(service.calculatePrice(2.5, DeliveryType.TO_ADDRESS)).isEqualByComparingTo(BigDecimal.valueOf(15.0));
    }
}
