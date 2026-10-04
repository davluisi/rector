package com.rector.repository;

import com.rector.entity.Specializzazione;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SpecializzazioneRepository extends JpaRepository<Specializzazione, Long> {
    List<Specializzazione> findAllByOrderByNomeAsc();
    java.util.Optional<Specializzazione> findByNomeIgnoreCase(String nome);
    boolean existsByNomeIgnoreCase(String nome);
    boolean existsByNomeIgnoreCaseAndIdNot(String nome, Long id);
}
