package com.rector.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "recensione", uniqueConstraints = {
    @UniqueConstraint(name = "uk_recensione_atleta_pt", columnNames = {"id_atleta", "id_personal_trainer"})
})
@Getter
@Setter
@NoArgsConstructor
public class Recensione {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_atleta", nullable = false)
    private UtenteAtleta atleta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_personal_trainer", nullable = false)
    private PersonalTrainer personalTrainer;

    @Column(name = "stelle", nullable = false)
    private int stelle;

    @Column(name = "commento", length = 1000)
    private String commento;

    @Column(name = "data_creazione", nullable = false)
    private LocalDateTime dataCreazione = LocalDateTime.now();

    @Column(name = "data_modifica", nullable = false)
    private LocalDateTime dataModifica = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.dataModifica = LocalDateTime.now();
    }
}
