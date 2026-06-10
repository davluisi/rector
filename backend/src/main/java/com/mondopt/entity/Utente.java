package com.mondopt.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "utente")
@Getter
@Setter
@NoArgsConstructor
public class Utente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome", nullable = false, length = 100)
    private String nome;

    @Column(name = "cognome", nullable = false, length = 100)
    private String cognome;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "url_immagine_profilo", length = 500)
    private String urlImmagineProfilo;

    @Column(name = "data_nascita")
    private LocalDate dataNascita;

    @Column(name = "peso", precision = 4, scale = 1)
    private BigDecimal peso;

    @Column(name = "altezza", precision = 4, scale = 1)
    private BigDecimal altezza;

    @Enumerated(EnumType.STRING)
    @Column(name = "genere", length = 20)
    private Genere genere;
}
