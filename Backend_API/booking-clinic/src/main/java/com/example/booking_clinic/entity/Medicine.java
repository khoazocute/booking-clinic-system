package com.example.booking_clinic.entity;

import jakarta.persistence.*;
import lombok.*;
import com.example.booking_clinic.entity.enums.MedicineStatus;

import java.math.BigDecimal;

@Entity
@Table(name = "medicines")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(name = "unit_price", precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(length = 30)
    private String unit; // viên, hộp, chai, ống

    @Enumerated(EnumType.STRING)
    private MedicineStatus status; // ACTIVE, INACTIVE
}
