package com.rector.repository;

import com.rector.entity.AtletaPersonalTrainer;
import com.rector.entity.AtletaPersonalTrainer.AtletaPersonalTrainerId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AtletaPersonalTrainerRepository extends JpaRepository<AtletaPersonalTrainer, AtletaPersonalTrainerId> {

    List<AtletaPersonalTrainer> findByIdIdAtletaAndAttivoTrue(Long idAtleta);

    List<AtletaPersonalTrainer> findByIdIdPersonalTrainerAndAttivoTrue(Long idPersonalTrainer);

    long countByIdIdAtletaAndAttivoTrue(Long idAtleta);

    long countByAttivoTrue();

    @Query("SELECT apt FROM AtletaPersonalTrainer apt " +
           "JOIN FETCH apt.personalTrainer pt " +
           "JOIN FETCH pt.utente u " +
           "WHERE apt.id.idAtleta = :idAtleta AND apt.attivo = true")
    List<AtletaPersonalTrainer> findActivePersonalTrainersByAtletaId(@Param("idAtleta") Long idAtleta);
}
