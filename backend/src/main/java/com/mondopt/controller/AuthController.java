package com.mondopt.controller;

import com.mondopt.dto.RegistrazioneRequest;
import com.mondopt.dto.LoginRequest;
import com.mondopt.entity.Utente;
import com.mondopt.repository.UtenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UtenteRepository utenteRepository;

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@(.+)$"
    );

    @PostMapping("/registra")
    public ResponseEntity<?> registra(@RequestBody RegistrazioneRequest request) {
        // Validation of mandatory fields
        if (request.getNome() == null || request.getNome().trim().isEmpty() ||
            request.getCognome() == null || request.getCognome().trim().isEmpty() ||
            request.getEmail() == null || request.getEmail().trim().isEmpty() ||
            request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Campi obbligatori mancanti"));
        }

        // Email format check
        if (!EMAIL_PATTERN.matcher(request.getEmail()).matches()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "formato email non valido"));
        }

        // Check if email is already in use
        if (utenteRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("errore", "email già in uso"));
        }

        // Create and save new user entity
        Utente utente = new Utente();
        utente.setNome(request.getNome().trim());
        utente.setCognome(request.getCognome().trim());
        utente.setEmail(request.getEmail().trim().toLowerCase());
        utente.setPassword(request.getPassword()); // Plan for password hashing later
        utente.setPeso(request.getPeso());
        utente.setAltezza(request.getAltezza());
        utente.setGenere(request.getGenere());

        utenteRepository.save(utente);

        return ResponseEntity.ok(Map.of("messaggio", "Registrazione avvenuta con successo"));
    }

    @PostMapping("/accedi")
    public ResponseEntity<?> accedi(@RequestBody LoginRequest request) {
        // Validation
        if (request.getEmail() == null || request.getEmail().trim().isEmpty() ||
            request.getPassword() == null || request.getPassword().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Inserisci l'email e la password"));
        }

        String email = request.getEmail().trim().toLowerCase();
        String password = request.getPassword();

        // Check if user exists
        java.util.Optional<Utente> optionalUtente = utenteRepository.findByEmail(email);
        if (optionalUtente.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("errore", "Non esiste un account con questa email, registrati"));
        }

        Utente utente = optionalUtente.get();

        // Check password
        if (!utente.getPassword().equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("errore", "Password errata"));
        }

        // Return user info on success
        return ResponseEntity.ok(Map.of(
            "id", utente.getId(),
            "nome", utente.getNome(),
            "cognome", utente.getCognome(),
            "email", utente.getEmail(),
            "urlImmagineProfilo", utente.getUrlImmagineProfilo() != null ? utente.getUrlImmagineProfilo() : ""
        ));
    }
}
