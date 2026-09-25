package com.rector.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verifica")
@Getter
@Setter
@NoArgsConstructor
public class OtpVerifica {

    @Id
    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "codice", nullable = false, length = 4)
    private String codice;

    @Column(name = "scadenza", nullable = false)
    private LocalDateTime scadenza;

    @Column(name = "verificato", nullable = false)
    private boolean verificato = false;

    @Column(name = "data_verifica")
    private LocalDateTime dataVerifica;
}
