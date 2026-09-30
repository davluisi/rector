package com.rector.repository;

import com.rector.entity.PersonalTrainer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PersonalTrainerRepository extends JpaRepository<PersonalTrainer, Long> {
    List<PersonalTrainer> findByVerificato(boolean verificato);
}
