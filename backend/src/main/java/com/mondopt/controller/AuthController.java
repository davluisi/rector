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
                .body(Map.of("errore", "Formato email non valido"));
        }

        // Check if email is already in use
        if (utenteRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("errore", "Email già in uso"));
        }

        // Create and save new user entity
        Utente utente = new Utente();
        utente.setNome(request.getNome().trim());
        utente.setCognome(request.getCognome().trim());
        utente.setEmail(request.getEmail().trim().toLowerCase());
        
        // Hash password with BCrypt
        String hashedPassword = org.mindrot.jbcrypt.BCrypt.hashpw(request.getPassword(), org.mindrot.jbcrypt.BCrypt.gensalt());
        utente.setPassword(hashedPassword);
        
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

        // Verify password using BCrypt with plain text fallback
        if (!checkPassword(password, utente.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("errore", "Password errata"));
        }

        // Return user info on success
        return ResponseEntity.ok(Map.of(
            "id", utente.getId(),
            "nome", utente.getNome(),
            "cognome", utente.getCognome(),
            "email", utente.getEmail(),
            "urlImmagineProfilo", utente.getUrlImmagineProfilo() != null ? utente.getUrlImmagineProfilo() : "",
            "peso", utente.getPeso() != null ? utente.getPeso().toString() : "",
            "altezza", utente.getAltezza() != null ? utente.getAltezza().toString() : "",
            "genere", utente.getGenere() != null ? utente.getGenere().name() : ""
        ));
    }

    @PutMapping("/aggiorna/{id}")
    public ResponseEntity<?> aggiorna(@PathVariable Long id, @RequestBody RegistrazioneRequest request) {
        java.util.Optional<Utente> optionalUtente = utenteRepository.findById(id);
        if (optionalUtente.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("errore", "Utente non trovato"));
        }

        Utente utente = optionalUtente.get();

        // Validation of mandatory fields
        if (request.getNome() == null || request.getNome().trim().isEmpty() ||
            request.getCognome() == null || request.getCognome().trim().isEmpty() ||
            request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Campi obbligatori mancanti"));
        }

        // Email format check
        if (!EMAIL_PATTERN.matcher(request.getEmail()).matches()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Formato email non valido"));
        }

        // Check if email is already in use by another user
        java.util.Optional<Utente> existingWithEmail = utenteRepository.findByEmail(request.getEmail().trim().toLowerCase());
        if (existingWithEmail.isPresent() && !existingWithEmail.get().getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("errore", "Email già in uso"));
        }

        // Update fields
        utente.setNome(request.getNome().trim());
        utente.setCognome(request.getCognome().trim());
        utente.setEmail(request.getEmail().trim().toLowerCase());
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            String hashedPassword = org.mindrot.jbcrypt.BCrypt.hashpw(request.getPassword().trim(), org.mindrot.jbcrypt.BCrypt.gensalt());
            utente.setPassword(hashedPassword);
        }
        utente.setPeso(request.getPeso());
        utente.setAltezza(request.getAltezza());
        utente.setGenere(request.getGenere());

        utenteRepository.save(utente);

        return ResponseEntity.ok(Map.of(
            "id", utente.getId(),
            "nome", utente.getNome(),
            "cognome", utente.getCognome(),
            "email", utente.getEmail(),
            "urlImmagineProfilo", utente.getUrlImmagineProfilo() != null ? utente.getUrlImmagineProfilo() : "",
            "peso", utente.getPeso() != null ? utente.getPeso().toString() : "",
            "altezza", utente.getAltezza() != null ? utente.getAltezza().toString() : "",
            "genere", utente.getGenere() != null ? utente.getGenere().name() : ""
        ));
    }

    @PutMapping("/cambia-password/{id}")
    public ResponseEntity<?> cambiaPassword(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String passwordAttuale = request.get("passwordAttuale");
        String nuovaPassword = request.get("nuovaPassword");
        String confermaNuovaPassword = request.get("confermaNuovaPassword");

        if (passwordAttuale == null || passwordAttuale.isEmpty() ||
            nuovaPassword == null || nuovaPassword.isEmpty() ||
            confermaNuovaPassword == null || confermaNuovaPassword.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Tutti i campi sono obbligatori"));
        }

        if (!nuovaPassword.equals(confermaNuovaPassword)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Le password non coincidono"));
        }

        java.util.Optional<Utente> optionalUtente = utenteRepository.findById(id);
        if (optionalUtente.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("errore", "Utente non trovato"));
        }

        Utente utente = optionalUtente.get();

        // Verify current password using BCrypt with plain text fallback
        if (!checkPassword(passwordAttuale, utente.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Password attuale non corretta"));
        }

        // Hash and save new password
        String hashedNuovaPassword = org.mindrot.jbcrypt.BCrypt.hashpw(nuovaPassword, org.mindrot.jbcrypt.BCrypt.gensalt());
        utente.setPassword(hashedNuovaPassword);
        utenteRepository.save(utente);

        return ResponseEntity.ok(Map.of("messaggio", "Password aggiornata con successo"));
    }

    // Helper method to verify passwords with support for both BCrypt hashes and legacy plain text
    private boolean checkPassword(String plainPassword, String storedPassword) {
        if (storedPassword == null) {
            return false;
        }
        if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2y$") || storedPassword.startsWith("$2b$")) {
            try {
                return org.mindrot.jbcrypt.BCrypt.checkpw(plainPassword, storedPassword);
            } catch (Exception e) {
                return false;
            }
        }
        return storedPassword.equals(plainPassword);
    }
}
