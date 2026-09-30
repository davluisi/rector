package com.rector.repository;

import com.rector.entity.GruppoEsercizio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GruppoEsercizioRepository extends JpaRepository<GruppoEsercizio, Long> {
    List<GruppoEsercizio> findByPersonalTrainerIdUtenteOrderByNomeAsc(Long idUtente);
}
