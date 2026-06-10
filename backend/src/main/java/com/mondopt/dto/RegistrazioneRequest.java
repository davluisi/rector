package com.mondopt.dto;

import com.mondopt.entity.Genere;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class RegistrazioneRequest {
    private String nome;
    private String cognome;
    private String email;
    private String password;
    private BigDecimal peso;
    private BigDecimal altezza;
    private Genere genere;
}
