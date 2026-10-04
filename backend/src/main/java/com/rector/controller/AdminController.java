package com.rector.controller;

import com.rector.entity.PersonalTrainer;
import com.rector.entity.Utente;
import com.rector.repository.PersonalTrainerRepository;
import com.rector.repository.UtenteRepository;
import com.rector.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UtenteRepository utenteRepository;

    @Autowired
    private PersonalTrainerRepository personalTrainerRepository;

    @Autowired
    private com.rector.repository.AtletaPersonalTrainerRepository atletaPersonalTrainerRepository;

    @Autowired
    private com.rector.repository.SpecializzazioneRepository specializzazioneRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private FileStorageService fileStorageService;

    // Helper to check admin privileges
    private boolean isUtenteAdmin(Long adminId) {
        if (adminId == null) return false;
        return utenteRepository.findById(adminId)
                .map(Utente::isAdmin)
                .orElse(false);
    }

    /**
     * Dashboard statistics: Total users, PTs, Pending PTs, Athletes, etc.
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getStats(@RequestHeader(value = "X-Admin-Id", required = false) Long adminId) {
        if (!isUtenteAdmin(adminId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("errore", "Accesso non autorizzato. Privilegi di amministratore richiesti."));
        }

        long totalUtenti = utenteRepository.count();
        long totalPt = personalTrainerRepository.count();
        List<PersonalTrainer> ptInAttesa = personalTrainerRepository.findByVerificato(false);
        List<PersonalTrainer> ptVerificati = personalTrainerRepository.findByVerificato(true);
        long abbonamentiAttivi = atletaPersonalTrainerRepository.countByAttivoTrue();

        long atletiCount = totalUtenti - totalPt;
        if (atletiCount < 0) atletiCount = 0;

        return ResponseEntity.ok(Map.of(
                "totaleUtenti", totalUtenti,
                "totalePt", totalPt,
                "ptInAttesa", ptInAttesa.size(),
                "ptVerificati", ptVerificati.size(),
                "totaleAtleti", atletiCount,
                "abbonamentiAttivi", abbonamentiAttivi,
                "volumeTransato", "0.00",
                "guadagnoPiattaforma", "0.00",
                "volumeMensile", "0.00",
                "guadagnoMensile", "0.00"
        ));
    }

    /**
     * List Personal Trainers pending verification or all PTs
     */
    @GetMapping("/pt-richieste")
    public ResponseEntity<?> getPtRichieste(
            @RequestHeader(value = "X-Admin-Id", required = false) Long adminId,
            @RequestParam(value = "soloInAttesa", defaultValue = "true") boolean soloInAttesa
    ) {
        if (!isUtenteAdmin(adminId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("errore", "Accesso non autorizzato."));
        }

        List<PersonalTrainer> list = soloInAttesa 
                ? personalTrainerRepository.findByVerificato(false) 
                : personalTrainerRepository.findAll();

        List<Map<String, Object>> result = new ArrayList<>();
        for (PersonalTrainer pt : list) {
            Utente u = pt.getUtente();
            if (u == null) continue;

            // Generate temporary presigned URLs (15 minutes) for private documents
            String urlFronte = null;
            if (pt.getDocumentoFronteKey() != null && !pt.getDocumentoFronteKey().isEmpty()) {
                urlFronte = fileStorageService.generatePresignedUrl(pt.getDocumentoFronteKey(), 900);
            }

            String urlRetro = null;
            if (pt.getDocumentoRetroKey() != null && !pt.getDocumentoRetroKey().isEmpty()) {
                urlRetro = fileStorageService.generatePresignedUrl(pt.getDocumentoRetroKey(), 900);
            }

            List<Map<String, String>> certificazioni = new ArrayList<>();
            if (pt.getCertificazioniKey() != null && !pt.getCertificazioniKey().isEmpty()) {
                String[] keys = pt.getCertificazioniKey().split(",");
                for (String k : keys) {
                    String cleanKey = k.trim();
                    if (!cleanKey.isEmpty()) {
                        String presigned = fileStorageService.generatePresignedUrl(cleanKey, 900);
                        String fileName = cleanKey.contains("/") ? cleanKey.substring(cleanKey.lastIndexOf('/') + 1) : cleanKey;
                        certificazioni.add(Map.of("key", cleanKey, "name", fileName, "url", presigned));
                    }
                }
            }

            Map<String, Object> ptData = new HashMap<>();
            ptData.put("idUtente", pt.getIdUtente());
            ptData.put("nome", u.getNome());
            ptData.put("cognome", u.getCognome());
            ptData.put("email", u.getEmail());
            ptData.put("urlImmagineProfilo", u.getUrlImmagineProfilo());
            ptData.put("verificato", pt.isVerificato());
            ptData.put("scadenzaDocumento", pt.getScadenzaDocumento() != null ? pt.getScadenzaDocumento().toString() : null);
            ptData.put("documentoFronteKey", pt.getDocumentoFronteKey());
            ptData.put("documentoFronteUrl", urlFronte);
            ptData.put("documentoRetroKey", pt.getDocumentoRetroKey());
            ptData.put("documentoRetroUrl", urlRetro);
            ptData.put("certificazioni", certificazioni);

            result.add(ptData);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Approve or Revoke PT Verification
     */
    @PutMapping("/pt/{idUtente}/stato-verifica")
    public ResponseEntity<?> aggiornaStatoVerifica(
            @RequestHeader(value = "X-Admin-Id", required = false) Long adminId,
            @PathVariable Long idUtente,
            @RequestBody Map<String, Boolean> request
    ) {
        if (!isUtenteAdmin(adminId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("errore", "Accesso non autorizzato."));
        }

        Boolean verificato = request.get("verificato");
        if (verificato == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("errore", "Specificare lo stato verificato (true o false)."));
        }

        Optional<PersonalTrainer> ptOpt = personalTrainerRepository.findById(idUtente);
        if (ptOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("errore", "Personal Trainer non trovato."));
        }

        PersonalTrainer pt = ptOpt.get();
        pt.setVerificato(verificato);
        personalTrainerRepository.save(pt);

        return ResponseEntity.ok(Map.of(
                "messaggio", verificato ? "Personal Trainer approvato con successo!" : "Verifica del Personal Trainer revocata.",
                "idUtente", idUtente,
                "verificato", verificato
        ));
    }

    /**
     * Recupera tutte le specializzazioni con conteggio dei PT associati (per admin)
     */
    @GetMapping("/specializzazioni")
    public ResponseEntity<?> getSpecializzazioni(@RequestHeader(value = "X-Admin-Id", required = false) Long adminId) {
        if (!isUtenteAdmin(adminId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("errore", "Accesso non autorizzato."));
        }

        List<com.rector.entity.Specializzazione> specs = specializzazioneRepository.findAllByOrderByNomeAsc();

        // Recuperiamo il conteggio di PT associati per ciascuna specializzazione
        List<Map<String, Object>> result = new ArrayList<>();
        for (com.rector.entity.Specializzazione spec : specs) {
            Integer countPt = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM personal_trainer_specializzazione WHERE id_specializzazione = ?",
                    Integer.class,
                    spec.getId()
            );
            Map<String, Object> item = new HashMap<>();
            item.put("id", spec.getId());
            item.put("nome", spec.getNome());
            item.put("conteggioPt", countPt != null ? countPt : 0);
            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Aggiunge una nuova specializzazione
     */
    @PostMapping("/specializzazioni")
    public ResponseEntity<?> creaSpecializzazione(
            @RequestHeader(value = "X-Admin-Id", required = false) Long adminId,
            @RequestBody Map<String, String> request
    ) {
        if (!isUtenteAdmin(adminId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("errore", "Accesso non autorizzato."));
        }

        String nome = request != null ? request.get("nome") : null;
        if (nome == null || nome.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("errore", "Il nome della specializzazione non può essere vuoto."));
        }
        nome = nome.trim();

        if (specializzazioneRepository.existsByNomeIgnoreCase(nome)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("errore", "Una specializzazione con questo nome esiste già."));
        }

        com.rector.entity.Specializzazione nuovaSpec = new com.rector.entity.Specializzazione();
        nuovaSpec.setNome(nome);
        com.rector.entity.Specializzazione salvata = specializzazioneRepository.save(nuovaSpec);

        return ResponseEntity.status(HttpStatus.CREATED).body(salvata);
    }

    /**
     * Modifica una specializzazione mantenendo invariato l'ID
     */
    @PutMapping("/specializzazioni/{id}")
    public ResponseEntity<?> aggiornaSpecializzazione(
            @RequestHeader(value = "X-Admin-Id", required = false) Long adminId,
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        if (!isUtenteAdmin(adminId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("errore", "Accesso non autorizzato."));
        }

        Optional<com.rector.entity.Specializzazione> specOpt = specializzazioneRepository.findById(id);
        if (specOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("errore", "Specializzazione non trovata."));
        }

        String nuovoNome = request != null ? request.get("nome") : null;
        if (nuovoNome == null || nuovoNome.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("errore", "Il nome della specializzazione non può essere vuoto."));
        }
        nuovoNome = nuovoNome.trim();

        if (specializzazioneRepository.existsByNomeIgnoreCaseAndIdNot(nuovoNome, id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("errore", "Esiste già un'altra specializzazione con questo nome."));
        }

        com.rector.entity.Specializzazione spec = specOpt.get();
        spec.setNome(nuovoNome);
        com.rector.entity.Specializzazione salvata = specializzazioneRepository.save(spec);

        return ResponseEntity.ok(salvata);
    }

    /**
     * Elimina una specializzazione e rimuove tutte le relative associazioni coi PT
     */
    @DeleteMapping("/specializzazioni/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> eliminaSpecializzazione(
            @RequestHeader(value = "X-Admin-Id", required = false) Long adminId,
            @PathVariable Long id
    ) {
        if (!isUtenteAdmin(adminId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("errore", "Accesso non autorizzato."));
        }

        Optional<com.rector.entity.Specializzazione> specOpt = specializzazioneRepository.findById(id);
        if (specOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("errore", "Specializzazione non trovata."));
        }

        // 1. Azzeriamo il riferimento a specializzazione_in_evidenza se punta a questa spec
        jdbcTemplate.update(
                "UPDATE personal_trainer SET id_specializzazione_in_evidenza = NULL WHERE id_specializzazione_in_evidenza = ?",
                id
        );

        // 2. Rimuoviamo le associazioni nella tabella ponte personal_trainer_specializzazione
        jdbcTemplate.update(
                "DELETE FROM personal_trainer_specializzazione WHERE id_specializzazione = ?",
                id
        );

        // 3. Eliminiamo l'entità specializzazione
        specializzazioneRepository.deleteById(id);

        return ResponseEntity.ok(Map.of(
                "messaggio", "Specializzazione eliminata con successo.",
                "id", id
        ));
    }
}
