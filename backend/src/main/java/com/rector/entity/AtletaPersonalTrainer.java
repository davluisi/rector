package com.rector.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "atleta_personal_trainer")
@Getter
@Setter
@NoArgsConstructor
public class AtletaPersonalTrainer {

    @EmbeddedId
    private AtletaPersonalTrainerId id = new AtletaPersonalTrainerId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("idAtleta")
    @JoinColumn(name = "id_atleta")
    private UtenteAtleta atleta;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("idPersonalTrainer")
    @JoinColumn(name = "id_personal_trainer")
    private PersonalTrainer personalTrainer;

    @Column(name = "data_inizio", nullable = false)
    private LocalDateTime dataInizio = LocalDateTime.now();

    @Column(name = "attivo", nullable = false)
    private boolean attivo = true;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    public static class AtletaPersonalTrainerId implements Serializable {
        @Column(name = "id_atleta")
        private Long idAtleta;

        @Column(name = "id_personal_trainer")
        private Long idPersonalTrainer;

        public AtletaPersonalTrainerId(Long idAtleta, Long idPersonalTrainer) {
            this.idAtleta = idAtleta;
            this.idPersonalTrainer = idPersonalTrainer;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            AtletaPersonalTrainerId that = (AtletaPersonalTrainerId) o;
            return java.util.Objects.equals(idAtleta, that.idAtleta) &&
                   java.util.Objects.equals(idPersonalTrainer, that.idPersonalTrainer);
        }

        @Override
        public int hashCode() {
            return java.util.Objects.hash(idAtleta, idPersonalTrainer);
        }
    }
}
