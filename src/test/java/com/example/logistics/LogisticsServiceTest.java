package com.example.logistics;

import com.example.logistics.model.DeliveryType;
import com.example.logistics.model.Employee;
import com.example.logistics.model.EmployeeType;
import com.example.logistics.model.Role;
import com.example.logistics.model.User;
import com.example.logistics.service.LogisticsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class LogisticsServiceTest {
    @Autowired
    private LogisticsService service;

    @Test
    void calculatesOfficeDeliveryPrice() {
        assertThat(service.calculatePrice(2.5, DeliveryType.TO_OFFICE)).isEqualByComparingTo(BigDecimal.valueOf(10.0));
    }

    @Test
    void calculatesAddressDeliveryPrice() {
        assertThat(service.calculatePrice(2.5, DeliveryType.TO_ADDRESS)).isEqualByComparingTo(BigDecimal.valueOf(15.0));
    }

    @Test
    void createsAndChangesUserRole() {
        User user = service.createUser("petar", "demo", "petar@example.test", Role.EMPLOYEE);

        assertThat(user.getUsername()).isEqualTo("petar");
        assertThat(service.login("petar", "demo").role()).isEqualTo(Role.EMPLOYEE);

        service.changeUserRole("petar", Role.ADMIN);

        assertThat(service.login("petar", "demo").role()).isEqualTo(Role.ADMIN);
    }

    @Test
    void loginIncludesEmployeeContext() {
        var session = service.login("nikolay", "demo");

        assertThat(session.employeeId()).isNotNull();
        assertThat(session.employeeType()).isEqualTo(EmployeeType.COURIER);
        assertThat(session.officeId()).isNotNull();
    }

    @Test
    void removesUser() {
        service.createUser("removed", "demo", "removed@example.test", Role.CLIENT);

        service.removeUser("removed");

        assertThat(service.users()).extracting(User::getUsername).doesNotContain("removed");
    }

    @Test
    void createsUserWhenSavingEmployeeWithoutUserId() {
        long companyId = service.snapshot().companies().getFirst().getId();
        long officeId = service.snapshot().offices().getFirst().getId();

        Employee employee = service.saveEmployee(new Employee(0, 0, companyId, officeId, "New", "Worker", EmployeeType.OFFICE_EMPLOYEE));

        assertThat(employee.getUserId()).isPositive();
        assertThat(service.users()).extracting(User::getId).contains(employee.getUserId());
    }
}
