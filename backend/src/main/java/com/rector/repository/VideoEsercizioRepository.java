package com.rector.repository;

import com.rector.entity.VideoEsercizio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VideoEsercizioRepository extends JpaRepository<VideoEsercizio, Long> {
    List<VideoEsercizio> findByPersonalTrainerIdUtenteOrderByDataCaricamentoDesc(Long idUtente);
    List<VideoEsercizio> findByPersonalTrainerIdUtenteAndGruppoIdOrderByDataCaricamentoDesc(Long idUtente, Long idGruppo);
    List<VideoEsercizio> findByPersonalTrainerIdUtenteAndGruppoIsNullOrderByDataCaricamentoDesc(Long idUtente);
    long countByGruppoId(Long idGruppo);
}
