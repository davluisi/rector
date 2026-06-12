package com.mondopt.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "personal_trainer")
@Getter
@Setter
@NoArgsConstructor
public class PersonalTrainer {

    @Id
    @Column(name = "id_utente")
    private Long idUtente;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id_utente")
    private Utente utente;

    @Column(name = "verificato", nullable = false)
    private boolean verificato = false;
}
