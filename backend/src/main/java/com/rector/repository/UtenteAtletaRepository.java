package com.rector.repository;

import com.rector.entity.UtenteAtleta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UtenteAtletaRepository extends JpaRepository<UtenteAtleta, Long> {
}
