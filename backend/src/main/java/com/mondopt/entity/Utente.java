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

    @OneToOne(mappedBy = "utente", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private UtenteAtleta atleta;

    @OneToOne(mappedBy = "utente", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private PersonalTrainer personalTrainer;

    @Enumerated(EnumType.STRING)
    @Column(name = "genere", length = 20)
    private Genere genere;

    public static final String RUOLO_PT = "pt";
    public static final String RUOLO_ATLETA = "utente_atleta";
    public static final String RUOLO_ENTRAMBI = "entrambi";

    @Column(name = "ruolo", length = 20)
    private String ruolo;

    @PrePersist
    @PreUpdate
    public void aggiornaRuoloAutomatico() {
        boolean isAtleta = this.atleta != null;
        boolean isPt = this.personalTrainer != null;
        if (isAtleta && isPt) {
            this.ruolo = RUOLO_ENTRAMBI;
        } else if (isPt) {
            this.ruolo = RUOLO_PT;
        } else if (isAtleta) {
            this.ruolo = RUOLO_ATLETA;
        } else {
            this.ruolo = null;
        }
    }

    public BigDecimal getPeso() {
        return atleta != null ? atleta.getPeso() : null;
    }

    public void setPeso(BigDecimal peso) {
        if (this.atleta == null) {
            this.atleta = new UtenteAtleta();
            this.atleta.setUtente(this);
        }
        this.atleta.setPeso(peso);
    }

    public BigDecimal getAltezza() {
        return atleta != null ? atleta.getAltezza() : null;
    }

    public void setAltezza(BigDecimal altezza) {
        if (this.atleta == null) {
            this.atleta = new UtenteAtleta();
            this.atleta.setUtente(this);
        }
        this.atleta.setAltezza(altezza);
    }
}
