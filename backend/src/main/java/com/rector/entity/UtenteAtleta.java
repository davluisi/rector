package com.rector.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "utente_atleta")
@Getter
@Setter
@NoArgsConstructor
public class UtenteAtleta {

    @Id
    @Column(name = "id_utente")
    private Long idUtente;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id_utente")
    private Utente utente;

    @Column(name = "peso", precision = 4, scale = 1)
    private BigDecimal peso;

    @Column(name = "altezza", precision = 4, scale = 1)
    private BigDecimal altezza;
}
