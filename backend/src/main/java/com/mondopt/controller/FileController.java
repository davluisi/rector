package com.mondopt.controller;

import com.mondopt.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private com.mondopt.repository.UtenteRepository utenteRepository;

    @PostMapping("/upload-immagine-profilo")
    public ResponseEntity<?> uploadImmagineProfilo(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Il file caricato è vuoto"));
        }

        try {
            String url = fileStorageService.uploadImmagineProfilo(
                file.getOriginalFilename(),
                file.getInputStream(),
                file.getContentType()
            );
            return ResponseEntity.ok(Map.of("url", url));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("errore", "Errore durante il caricamento del file: " + e.getMessage()));
        }
    }

    @DeleteMapping("/pulisci-immagini-orfane")
    public ResponseEntity<?> pulisciImmaginiOrfane() {
        try {
            // 1. Get all active profile image URLs from database
            java.util.List<com.mondopt.entity.Utente> utenti = utenteRepository.findAll();
            java.util.Set<String> activeKeys = new java.util.HashSet<>();
            for (com.mondopt.entity.Utente u : utenti) {
                String url = u.getUrlImmagineProfilo();
                if (url != null && !url.trim().isEmpty()) {
                    int index = url.indexOf("immagini-profilo/");
                    if (index != -1) {
                        activeKeys.add(url.substring(index));
                    }
                }
            }

            // 2. List all objects in S3 under prefix "immagini-profilo/"
            java.util.List<String> s3Keys = fileStorageService.listKeys("immagini-profilo/");

            // 3. Compare and delete orphaned objects
            java.util.List<String> deletedKeys = new java.util.ArrayList<>();
            for (String key : s3Keys) {
                // Ignore the prefix directory itself if S3 returns it
                if (key.equals("immagini-profilo/")) {
                    continue;
                }
                if (!activeKeys.contains(key)) {
                    fileStorageService.delete(key);
                    deletedKeys.add(key);
                }
            }

            return ResponseEntity.ok(Map.of(
                "messaggio", "Pulizia completata con successo",
                "immaginiRimosse", deletedKeys,
                "quantitaRimossa", deletedKeys.size()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("errore", "Errore durante la pulizia: " + e.getMessage()));
        }
    }
}
