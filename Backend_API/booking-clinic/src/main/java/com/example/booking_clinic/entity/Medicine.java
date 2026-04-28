package com.example.booking_clinic.entity;

import jakarta.persistence.*;
import lombok.*;
import com.example.booking_clinic.entity.enums.MedicineStatus;

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

    @Enumerated(EnumType.STRING)
    private MedicineStatus status; // ACTIVE, INACTIVE
}
