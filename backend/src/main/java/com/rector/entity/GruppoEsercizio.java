package com.rector.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "gruppo_esercizio")
@Getter
@Setter
@NoArgsConstructor
public class GruppoEsercizio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_personal_trainer", nullable = false)
    private PersonalTrainer personalTrainer;

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    @Column(name = "data_creazione", nullable = false)
    private LocalDateTime dataCreazione = LocalDateTime.now();
}
