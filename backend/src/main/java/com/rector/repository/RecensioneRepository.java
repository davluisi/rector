package com.rector.repository;

import com.rector.entity.Recensione;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecensioneRepository extends JpaRepository<Recensione, Long> {

    Optional<Recensione> findByAtletaIdUtenteAndPersonalTrainerIdUtente(Long idAtleta, Long idPersonalTrainer);

    List<Recensione> findByPersonalTrainerIdUtente(Long idPersonalTrainer);

    @Query("SELECT r.personalTrainer.idUtente, AVG(r.stelle), COUNT(r.id) FROM Recensione r GROUP BY r.personalTrainer.idUtente")
    List<Object[]> findStatsRecensioniGroupByPt();

    @Query("SELECT AVG(r.stelle), COUNT(r.id) FROM Recensione r WHERE r.personalTrainer.idUtente = :idPersonalTrainer")
    List<Object[]> findStatsByPtId(@Param("idPersonalTrainer") Long idPersonalTrainer);
}
