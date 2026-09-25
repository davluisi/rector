package com.rector.repository;

import com.rector.entity.OtpVerifica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OtpVerificaRepository extends JpaRepository<OtpVerifica, String> {
}
