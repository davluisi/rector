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
}
