package com.rector.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "video_esercizio")
@Getter
@Setter
@NoArgsConstructor
public class VideoEsercizio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_personal_trainer", nullable = false)
    private PersonalTrainer personalTrainer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_gruppo")
    private GruppoEsercizio gruppo;

    @Column(name = "nome", nullable = false, length = 200)
    private String nome;

    @Column(name = "url_video", nullable = false, length = 1000)
    private String urlVideo;

    @Column(name = "url_anteprima", length = 1000)
    private String urlAnteprima;

    @Column(name = "data_caricamento", nullable = false)
    private LocalDateTime dataCaricamento = LocalDateTime.now();
}
