package com.example.booking_clinic.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "prescription_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id")
    private Prescription prescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    @Column(name = "dose_per_time")
    private Integer dosePerTime;

    @Column(name = "times_per_day")
    private Integer timesPerDay;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "quantity")
    private Integer quantity; // dosePerTime * timesPerDay * durationDays

    @Column(name = "unit_price", precision = 12, scale = 2)
    private BigDecimal unitPrice; // Snapshot giá thuốc tại thời điểm kê đơn

    @Column(name = "line_total", precision = 12, scale = 2)
    private BigDecimal lineTotal; // unitPrice * quantity (auto-calculated)

    @Column(name = "dosage_text")
    private String dosageText;

    @Column(columnDefinition = "TEXT")
    private String instruction;

    @Column(columnDefinition = "TEXT")
    private String note;
}
