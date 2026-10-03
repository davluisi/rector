package com.rector.controller;

import com.rector.entity.AtletaPersonalTrainer;
import com.rector.entity.PersonalTrainer;
import com.rector.entity.Recensione;
import com.rector.entity.UtenteAtleta;
import com.rector.repository.AtletaPersonalTrainerRepository;
import com.rector.repository.PersonalTrainerRepository;
import com.rector.repository.RecensioneRepository;
import com.rector.repository.UtenteAtletaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/recensioni")
@CrossOrigin(origins = "*")
public class RecensioneController {

    @Autowired
    private RecensioneRepository recensioneRepository;

    @Autowired
    private AtletaPersonalTrainerRepository atletaPersonalTrainerRepository;

    @Autowired
    private UtenteAtletaRepository utenteAtletaRepository;

    @Autowired
    private PersonalTrainerRepository personalTrainerRepository;

    /**
     * Recupera la recensione lasciata da un atleta a un personal trainer (se presente)
     */
    @GetMapping("/atleta/{idAtleta}/pt/{idPt}")
    public ResponseEntity<?> getRecensioneAtletaPt(@PathVariable Long idAtleta, @PathVariable Long idPt) {
        Optional<Recensione> recensioneOpt = recensioneRepository.findByAtletaIdUtenteAndPersonalTrainerIdUtente(idAtleta, idPt);
        if (recensioneOpt.isPresent()) {
            Recensione r = recensioneOpt.get();
            Map<String, Object> resp = new HashMap<>();
            resp.put("id", r.getId());
            resp.put("stelle", r.getStelle());
            resp.put("commento", r.getCommento() != null ? r.getCommento() : "");
            resp.put("dataModifica", r.getDataModifica());
            return ResponseEntity.ok(resp);
        } else {
            return ResponseEntity.ok(Map.of("exists", false));
        }
    }

    /**
     * Salva o modifica una recensione: consentito solo se l'atleta ha una relazione attiva con il PT.
     */
    @PostMapping
    public ResponseEntity<?> salvaOAggiornaRecensione(@RequestBody Map<String, Object> body) {
        if (!body.containsKey("idAtleta") || !body.containsKey("idPersonalTrainer") || !body.containsKey("stelle")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Campi idAtleta, idPersonalTrainer e stelle sono obbligatori"));
        }

        Long idAtleta = Long.valueOf(body.get("idAtleta").toString());
        Long idPt = Long.valueOf(body.get("idPersonalTrainer").toString());
        int stelle;
        try {
            stelle = Integer.parseInt(body.get("stelle").toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Il numero di stelle deve essere un intero valido"));
        }

        if (stelle < 1 || stelle > 5) {
            return ResponseEntity.badRequest().body(Map.of("error", "Il numero di stelle deve essere compreso tra 1 e 5"));
        }

        String commento = body.get("commento") != null ? body.get("commento").toString().trim() : null;

        // Verifica che ci sia una relazione attiva tra atleta e PT
        List<AtletaPersonalTrainer> relazioni = atletaPersonalTrainerRepository.findActivePersonalTrainersByAtletaId(idAtleta);
        boolean haRelazioneAttiva = relazioni.stream()
                .anyMatch(r -> r.getPersonalTrainer() != null && r.getPersonalTrainer().getIdUtente().equals(idPt));

        if (!haRelazioneAttiva) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Puoi recensire solo un personal trainer con cui hai un abbonamento o percorso attivo"));
        }

        UtenteAtleta atleta = utenteAtletaRepository.findById(idAtleta).orElse(null);
        PersonalTrainer pt = personalTrainerRepository.findById(idPt).orElse(null);

        if (atleta == null || pt == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Atleta o Personal Trainer non trovato"));
        }

        // Cerca eventuale recensione preesistente per modificarla, altrimenti crea nuova
        Optional<Recensione> esistenteOpt = recensioneRepository.findByAtletaIdUtenteAndPersonalTrainerIdUtente(idAtleta, idPt);
        Recensione recensione;
        if (esistenteOpt.isPresent()) {
            recensione = esistenteOpt.get();
        } else {
            recensione = new Recensione();
            recensione.setAtleta(atleta);
            recensione.setPersonalTrainer(pt);
        }

        recensione.setStelle(stelle);
        recensione.setCommento(commento);

        recensioneRepository.save(recensione);

        // Ricalcola media per risposta
        List<Object[]> stats = recensioneRepository.findStatsByPtId(idPt);
        Double media = 0.0;
        Long totale = 0L;
        if (stats != null && !stats.isEmpty() && stats.get(0)[0] != null) {
            media = ((Number) stats.get(0)[0]).doubleValue();
            totale = ((Number) stats.get(0)[1]).longValue();
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Recensione salvata con successo");
        resp.put("id", recensione.getId());
        resp.put("stelle", recensione.getStelle());
        resp.put("commento", recensione.getCommento());
        resp.put("mediaStelle", Math.round(media * 10.0) / 10.0);
        resp.put("numeroRecensioni", totale);

        return ResponseEntity.ok(resp);
    }
}
