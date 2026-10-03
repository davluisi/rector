package com.rector.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "specializzazione")
@Getter
@Setter
@NoArgsConstructor
public class Specializzazione {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome", nullable = false, unique = true, length = 100)
    private String nome;

    public Specializzazione(Long id, String nome) {
        this.id = id;
        this.nome = nome;
    }
}
