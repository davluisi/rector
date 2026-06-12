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
}
