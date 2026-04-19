package com.example.booking_clinic.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "doctors")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {

    @Id
    @Column(name = "user_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "specialty_id")
    private Long specialtyId;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "qualification", length = 255)
    private String qualification;

    @Column(name = "biography", columnDefinition = "TEXT")
    private String biography;

    @Column(name = "clinic_room", length = 100)
    private String clinicRoom;

    @Column(name = "average_rating")
    private Double averageRating;

    @Column(name = "status", length = 50)
    private String status;
}
