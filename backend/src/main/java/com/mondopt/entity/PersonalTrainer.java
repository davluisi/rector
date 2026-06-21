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

    @Column(name = "scadenza_documento")
    private java.time.LocalDate scadenzaDocumento;

    @Column(name = "documento_fronte_key", length = 500)
    private String documentoFronteKey;

    @Column(name = "documento_retro_key", length = 500)
    private String documentoRetroKey;

    @Column(name = "certificazioni_key", length = 1000)
    private String certificazioniKey;
}
