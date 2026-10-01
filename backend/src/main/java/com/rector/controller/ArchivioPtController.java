package com.rector.controller;

import com.rector.entity.GruppoEsercizio;
import com.rector.entity.PersonalTrainer;
import com.rector.entity.VideoEsercizio;
import com.rector.repository.GruppoEsercizioRepository;
import com.rector.repository.PersonalTrainerRepository;
import com.rector.repository.VideoEsercizioRepository;
import com.rector.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/archivio")
@CrossOrigin(origins = "*")
public class ArchivioPtController {

    @Autowired
    private GruppoEsercizioRepository gruppoEsercizioRepository;

    @Autowired
    private VideoEsercizioRepository videoEsercizioRepository;

    @Autowired
    private PersonalTrainerRepository personalTrainerRepository;

    @Autowired
    private FileStorageService fileStorageService;

    // 1. Ottieni la lista dei gruppi creati dal PT (incluso conteggio video per ciascuno)
    @GetMapping("/gruppi")
    public ResponseEntity<?> getGruppi(@RequestParam Long idPt) {
        Optional<PersonalTrainer> ptOpt = personalTrainerRepository.findById(idPt);
        if (ptOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("errore", "Personal Trainer non trovato"));
        }

        List<GruppoEsercizio> gruppi = gruppoEsercizioRepository.findByPersonalTrainerIdUtenteOrderByNomeAsc(idPt);
        List<Map<String, Object>> response = gruppi.stream().map(g -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", g.getId());
            map.put("nome", g.getNome());
            map.put("dataCreazione", g.getDataCreazione());
            map.put("numeroVideo", videoEsercizioRepository.countByGruppoId(g.getId()));
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // 2. Crea un nuovo gruppo
    @PostMapping("/gruppi")
    public ResponseEntity<?> creaGruppo(@RequestBody Map<String, Object> body) {
        Object idPtObj = body.get("idPt");
        String nome = (String) body.get("nome");

        if (idPtObj == null || nome == null || nome.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("errore", "ID Personal Trainer e nome del gruppo sono obbligatori"));
        }

        Long idPt = Long.valueOf(idPtObj.toString());
        Optional<PersonalTrainer> ptOpt = personalTrainerRepository.findById(idPt);
        if (ptOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("errore", "Personal Trainer non trovato"));
        }

        GruppoEsercizio gruppo = new GruppoEsercizio();
        gruppo.setPersonalTrainer(ptOpt.get());
        gruppo.setNome(nome.trim());

        GruppoEsercizio salvato = gruppoEsercizioRepository.save(gruppo);

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", salvato.getId());
        resp.put("nome", salvato.getNome());
        resp.put("dataCreazione", salvato.getDataCreazione());
        resp.put("numeroVideo", 0);

        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    // 3. Rinomina un gruppo
    @PutMapping("/gruppi/{id}")
    public ResponseEntity<?> rinominaGruppo(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String nuovoNome = (String) body.get("nome");
        if (nuovoNome == null || nuovoNome.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("errore", "Il nome del gruppo non può essere vuoto"));
        }

        Optional<GruppoEsercizio> gruppoOpt = gruppoEsercizioRepository.findById(id);
        if (gruppoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("errore", "Gruppo non trovato"));
        }

        GruppoEsercizio gruppo = gruppoOpt.get();
        gruppo.setNome(nuovoNome.trim());
        gruppoEsercizioRepository.save(gruppo);

        return ResponseEntity.ok(Map.of("messaggio", "Gruppo rinominato con successo", "nome", gruppo.getNome()));
    }

    // 4. Elimina un gruppo (i video contenuti rimangono nell'archivio generale senza gruppo)
    @DeleteMapping("/gruppi/{id}")
    public ResponseEntity<?> eliminaGruppo(@PathVariable Long id) {
        Optional<GruppoEsercizio> gruppoOpt = gruppoEsercizioRepository.findById(id);
        if (gruppoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("errore", "Gruppo non trovato"));
        }

        GruppoEsercizio gruppo = gruppoOpt.get();
        // Scollega i video da questo gruppo prima di eliminare
        List<VideoEsercizio> videoDelGruppo = videoEsercizioRepository
                .findByPersonalTrainerIdUtenteAndGruppoIdOrderByDataCaricamentoDesc(gruppo.getPersonalTrainer().getIdUtente(), id);
        for (VideoEsercizio v : videoDelGruppo) {
            v.setGruppo(null);
        }
        videoEsercizioRepository.saveAll(videoDelGruppo);

        gruppoEsercizioRepository.delete(gruppo);
        return ResponseEntity.ok(Map.of("messaggio", "Gruppo eliminato con successo"));
    }

    // 5. Ottieni tutti i video del PT (con possibilità di filtrare per gruppo o tutti)
    @GetMapping("/video")
    public ResponseEntity<?> getVideo(
            @RequestParam Long idPt,
            @RequestParam(required = false) Long idGruppo,
            @RequestParam(required = false) Boolean soloSenzaGruppo) {

        Optional<PersonalTrainer> ptOpt = personalTrainerRepository.findById(idPt);
        if (ptOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("errore", "Personal Trainer non trovato"));
        }

        List<VideoEsercizio> videoList;
        if (Boolean.TRUE.equals(soloSenzaGruppo)) {
            videoList = videoEsercizioRepository.findByPersonalTrainerIdUtenteAndGruppoIsNullOrderByDataCaricamentoDesc(idPt);
        } else if (idGruppo != null) {
            videoList = videoEsercizioRepository.findByPersonalTrainerIdUtenteAndGruppoIdOrderByDataCaricamentoDesc(idPt, idGruppo);
        } else {
            videoList = videoEsercizioRepository.findByPersonalTrainerIdUtenteOrderByDataCaricamentoDesc(idPt);
        }

        List<Map<String, Object>> response = videoList.stream().map(v -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", v.getId());
            map.put("nome", v.getNome());
            map.put("urlVideo", v.getUrlVideo());
            map.put("urlAnteprima", v.getUrlAnteprima());
            map.put("dataCaricamento", v.getDataCaricamento());
            map.put("idGruppo", v.getGruppo() != null ? v.getGruppo().getId() : null);
            map.put("nomeGruppo", v.getGruppo() != null ? v.getGruppo().getNome() : null);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // 6. Salva un nuovo video nell'archivio
    @PostMapping("/video")
    public ResponseEntity<?> salvaVideo(@RequestBody Map<String, Object> body) {
        Object idPtObj = body.get("idPt");
        String nome = (String) body.get("nome");
        String urlVideo = (String) body.get("urlVideo");
        String urlAnteprima = (String) body.get("urlAnteprima");
        Object idGruppoObj = body.get("idGruppo");

        if (idPtObj == null || nome == null || nome.trim().isEmpty() || urlVideo == null || urlVideo.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("errore", "Campi obbligatori mancanti (PT, nome esercizio, video)"));
        }

        Long idPt = Long.valueOf(idPtObj.toString());
        Optional<PersonalTrainer> ptOpt = personalTrainerRepository.findById(idPt);
        if (ptOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("errore", "Personal Trainer non trovato"));
        }

        VideoEsercizio video = new VideoEsercizio();
        video.setPersonalTrainer(ptOpt.get());
        video.setNome(nome.trim());
        video.setUrlVideo(urlVideo.trim());
        if (urlAnteprima != null && !urlAnteprima.trim().isEmpty()) {
            video.setUrlAnteprima(urlAnteprima.trim());
        }

        if (idGruppoObj != null && !idGruppoObj.toString().isEmpty()) {
            Long idGruppo = Long.valueOf(idGruppoObj.toString());
            Optional<GruppoEsercizio> gruppoOpt = gruppoEsercizioRepository.findById(idGruppo);
            gruppoOpt.ifPresent(video::setGruppo);
        }

        VideoEsercizio salvato = videoEsercizioRepository.save(video);

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", salvato.getId());
        resp.put("nome", salvato.getNome());
        resp.put("urlVideo", salvato.getUrlVideo());
        resp.put("urlAnteprima", salvato.getUrlAnteprima());
        resp.put("dataCaricamento", salvato.getDataCaricamento());
        resp.put("idGruppo", salvato.getGruppo() != null ? salvato.getGruppo().getId() : null);
        resp.put("nomeGruppo", salvato.getGruppo() != null ? salvato.getGruppo().getNome() : null);

        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    // 7. Modifica dettagli video (nome esercizio o gruppo associato o anteprima)
    @PutMapping("/video/{id}")
    public ResponseEntity<?> modificaVideo(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Optional<VideoEsercizio> videoOpt = videoEsercizioRepository.findById(id);
        if (videoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("errore", "Video non trovato"));
        }

        VideoEsercizio video = videoOpt.get();

        if (body.containsKey("nome")) {
            String nuovoNome = (String) body.get("nome");
            if (nuovoNome != null && !nuovoNome.trim().isEmpty()) {
                video.setNome(nuovoNome.trim());
            }
        }

        if (body.containsKey("urlVideo")) {
            String nuovoVideo = (String) body.get("urlVideo");
            if (nuovoVideo != null && !nuovoVideo.trim().isEmpty()) {
                String vecchioUrl = video.getUrlVideo();
                if (vecchioUrl != null && !vecchioUrl.equals(nuovoVideo)) {
                    int index = vecchioUrl.indexOf("video-esercizi-pt/");
                    if (index != -1) {
                        try {
                            fileStorageService.delete(vecchioUrl.substring(index));
                        } catch (Exception e) {
                            System.err.println("Impossibile cancellare vecchio video da S3: " + e.getMessage());
                        }
                    }
                }
                video.setUrlVideo(nuovoVideo);
            }
        }

        if (body.containsKey("urlAnteprima")) {
            String nuovaAnteprima = (String) body.get("urlAnteprima");
            String vecchiaAnteprima = video.getUrlAnteprima();
            if (vecchiaAnteprima != null && nuovaAnteprima != null && !vecchiaAnteprima.equals(nuovaAnteprima)) {
                int index = vecchiaAnteprima.indexOf("anteprime-esercizi-pt/");
                if (index != -1) {
                    try {
                        fileStorageService.delete(vecchiaAnteprima.substring(index));
                    } catch (Exception e) {
                        System.err.println("Impossibile cancellare vecchia anteprima da S3: " + e.getMessage());
                    }
                }
            }
            video.setUrlAnteprima(nuovaAnteprima);
        }

        if (body.containsKey("idGruppo")) {
            Object idGruppoObj = body.get("idGruppo");
            if (idGruppoObj == null || idGruppoObj.toString().isEmpty()) {
                video.setGruppo(null);
            } else {
                Long idGruppo = Long.valueOf(idGruppoObj.toString());
                Optional<GruppoEsercizio> gruppoOpt = gruppoEsercizioRepository.findById(idGruppo);
                if (gruppoOpt.isPresent()) {
                    video.setGruppo(gruppoOpt.get());
                } else {
                    video.setGruppo(null);
                }
            }
        }

        VideoEsercizio salvato = videoEsercizioRepository.save(video);

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", salvato.getId());
        resp.put("nome", salvato.getNome());
        resp.put("urlVideo", salvato.getUrlVideo());
        resp.put("urlAnteprima", salvato.getUrlAnteprima());
        resp.put("dataCaricamento", salvato.getDataCaricamento());
        resp.put("idGruppo", salvato.getGruppo() != null ? salvato.getGruppo().getId() : null);
        resp.put("nomeGruppo", salvato.getGruppo() != null ? salvato.getGruppo().getNome() : null);

        return ResponseEntity.ok(resp);
    }

    // 8. Elimina un video dall'archivio (e rimuove il file e l'anteprima da S3 se applicabile)
    @DeleteMapping("/video/{id}")
    public ResponseEntity<?> eliminaVideo(@PathVariable Long id) {
        Optional<VideoEsercizio> videoOpt = videoEsercizioRepository.findById(id);
        if (videoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("errore", "Video non trovato"));
        }

        VideoEsercizio video = videoOpt.get();
        String url = video.getUrlVideo();
        String anteprima = video.getUrlAnteprima();

        // Tenta rimozione video da S3
        if (url != null) {
            int index = url.indexOf("video-esercizi-pt/");
            if (index != -1) {
                String key = url.substring(index);
                try {
                    fileStorageService.delete(key);
                } catch (Exception e) {
                    System.err.println("Impossibile cancellare video da S3: " + key + " - " + e.getMessage());
                }
            }
        }

        // Tenta rimozione anteprima da S3
        if (anteprima != null) {
            int index = anteprima.indexOf("anteprime-esercizi-pt/");
            if (index != -1) {
                String key = anteprima.substring(index);
                try {
                    fileStorageService.delete(key);
                } catch (Exception e) {
                    System.err.println("Impossibile cancellare anteprima da S3: " + key + " - " + e.getMessage());
                }
            }
        }

        videoEsercizioRepository.delete(video);
        return ResponseEntity.ok(Map.of("messaggio", "Video eliminato con successo"));
    }
}
