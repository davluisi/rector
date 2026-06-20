package com.mondopt.controller;

import com.mondopt.dto.RegistrazioneRequest;
import com.mondopt.dto.LoginRequest;
import com.mondopt.entity.Utente;
import com.mondopt.entity.OtpVerifica;
import com.mondopt.repository.UtenteRepository;
import com.mondopt.repository.OtpVerificaRepository;
import com.mondopt.service.FileStorageService;
import com.mondopt.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Random;
import java.util.regex.Pattern;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UtenteRepository utenteRepository;

    @Autowired
    private OtpVerificaRepository otpVerificaRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private FileStorageService fileStorageService;

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@(.+)$"
    );

    @PostMapping("/invia-otp")
    public ResponseEntity<?> inviaOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Inserisci l'email"));
        }
        String cleanEmail = email.trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(cleanEmail).matches()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Formato email non valido"));
        }

        // Generate 4-digit OTP code
        Random random = new Random();
        String codice = String.format("%04d", random.nextInt(10000));

        OtpVerifica otpVerifica = otpVerificaRepository.findById(cleanEmail)
            .orElse(new OtpVerifica());
        
        otpVerifica.setEmail(cleanEmail);
        otpVerifica.setCodice(codice);
        otpVerifica.setScadenza(LocalDateTime.now().plusMinutes(5));
        otpVerifica.setVerificato(false);
        otpVerifica.setDataVerifica(null);

        otpVerificaRepository.save(otpVerifica);

        // Send Email
        emailService.sendOtpEmail(cleanEmail, codice);

        return ResponseEntity.ok(Map.of("messaggio", "Codice di verifica inviato"));
    }

    @PostMapping("/verifica-otp")
    public ResponseEntity<?> verificaOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String codice = request.get("codice");

        if (email == null || email.trim().isEmpty() || codice == null || codice.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Email e codice sono obbligatori"));
        }

        String cleanEmail = email.trim().toLowerCase();
        java.util.Optional<OtpVerifica> otpOpt = otpVerificaRepository.findById(cleanEmail);

        if (otpOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Nessun codice richiesto per questa email"));
        }

        OtpVerifica otpVerifica = otpOpt.get();
        if (otpVerifica.getScadenza().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Il codice è scaduto. Richiedine uno nuovo."));
        }

        if (!otpVerifica.getCodice().equals(codice.trim())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Codice non corretto"));
        }

        otpVerifica.setVerificato(true);
        otpVerifica.setDataVerifica(LocalDateTime.now());
        otpVerificaRepository.save(otpVerifica);

        return ResponseEntity.ok(Map.of("verificato", true, "messaggio", "Email verificata con successo"));
    }

    @GetMapping("/verifica-email")
    public ResponseEntity<?> verificaEmail(@RequestParam String email) {
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Inserisci l'email"));
        }
        if (!EMAIL_PATTERN.matcher(email.trim()).matches()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Formato email non valido"));
        }
        if (utenteRepository.findByEmail(email.trim().toLowerCase()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("errore", "Email già in uso"));
        }
        return ResponseEntity.ok(Map.of("disponibile", true));
    }

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
        if (utenteRepository.findByEmail(request.getEmail().trim().toLowerCase()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("errore", "Email già in uso"));
        }

        // Verify OTP is valid and verified in the last 15 minutes
        java.util.Optional<OtpVerifica> otpOpt = otpVerificaRepository.findById(request.getEmail().trim().toLowerCase());
        if (otpOpt.isEmpty() || !otpOpt.get().isVerificato() || otpOpt.get().getDataVerifica().isBefore(LocalDateTime.now().minusMinutes(15))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("errore", "Email non verificata tramite OTP o codice scaduto. Effettua nuovamente la verifica."));
        }

        // Create and save new user entity
        Utente utente = new Utente();
        utente.setNome(request.getNome().trim());
        utente.setCognome(request.getCognome().trim());
        utente.setEmail(request.getEmail().trim().toLowerCase());
        utente.setDataNascita(request.getDataNascita());
        utente.setGenere(request.getGenere());
        utente.setUrlImmagineProfilo(request.getUrlImmagineProfilo());
        
        // Hash password with BCrypt
        String hashedPassword = org.mindrot.jbcrypt.BCrypt.hashpw(request.getPassword(), org.mindrot.jbcrypt.BCrypt.gensalt());
        utente.setPassword(hashedPassword);
        
        if ("PERSONAL_TRAINER".equalsIgnoreCase(request.getRuolo())) {
            com.mondopt.entity.PersonalTrainer pt = new com.mondopt.entity.PersonalTrainer();
            pt.setUtente(utente);
            utente.setPersonalTrainer(pt);
        } else {
            // Default: ATLETA
            com.mondopt.entity.UtenteAtleta atleta = new com.mondopt.entity.UtenteAtleta();
            atleta.setUtente(utente);
            atleta.setPeso(request.getPeso());
            atleta.setAltezza(request.getAltezza());
            utente.setAtleta(atleta);
        }

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
                .body(Map.of("errore", "Non esiste un account con questa email"));
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
            "genere", utente.getGenere() != null ? utente.getGenere().name() : "",
            "ruolo", utente.getPersonalTrainer() != null ? "PERSONAL_TRAINER" : "ATLETA",
            "dataNascita", utente.getDataNascita() != null ? utente.getDataNascita().toString() : ""
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

        // Verify OTP if email changed
        String newEmail = request.getEmail().trim().toLowerCase();
        if (!newEmail.equals(utente.getEmail())) {
            java.util.Optional<OtpVerifica> otpOpt = otpVerificaRepository.findById(newEmail);
            if (otpOpt.isEmpty() || !otpOpt.get().isVerificato() || otpOpt.get().getDataVerifica().isBefore(LocalDateTime.now().minusMinutes(15))) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("errore", "La nuova email non è stata verificata tramite OTP o codice scaduto."));
            }
        }

        // Update fields
        utente.setNome(request.getNome().trim());
        utente.setCognome(request.getCognome().trim());
        utente.setEmail(request.getEmail().trim().toLowerCase());
        utente.setDataNascita(request.getDataNascita());
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            String hashedPassword = org.mindrot.jbcrypt.BCrypt.hashpw(request.getPassword().trim(), org.mindrot.jbcrypt.BCrypt.gensalt());
            utente.setPassword(hashedPassword);
        }
        if (utente.getPersonalTrainer() == null) {
            // It is an athlete, so we can save physical stats
            utente.setPeso(request.getPeso());
            utente.setAltezza(request.getAltezza());
        }
        utente.setGenere(request.getGenere());

        // Delete old profile image from S3 if it changed
        String oldUrl = utente.getUrlImmagineProfilo();
        String newUrl = request.getUrlImmagineProfilo();
        if (oldUrl != null && !oldUrl.trim().isEmpty() && !oldUrl.equals(newUrl)) {
            int index = oldUrl.indexOf("immagini-profilo/");
            if (index != -1) {
                String oldKey = oldUrl.substring(index);
                try {
                    fileStorageService.delete(oldKey);
                } catch (Exception e) {
                    System.err.println("Warning: failed to delete old profile image from S3: " + oldKey);
                    e.printStackTrace();
                }
            }
        }
        utente.setUrlImmagineProfilo(newUrl);

        utenteRepository.save(utente);

        return ResponseEntity.ok(Map.of(
            "id", utente.getId(),
            "nome", utente.getNome(),
            "cognome", utente.getCognome(),
            "email", utente.getEmail(),
            "urlImmagineProfilo", utente.getUrlImmagineProfilo() != null ? utente.getUrlImmagineProfilo() : "",
            "peso", utente.getPeso() != null ? utente.getPeso().toString() : "",
            "altezza", utente.getAltezza() != null ? utente.getAltezza().toString() : "",
            "genere", utente.getGenere() != null ? utente.getGenere().name() : "",
            "ruolo", utente.getPersonalTrainer() != null ? "PERSONAL_TRAINER" : "ATLETA",
            "dataNascita", utente.getDataNascita() != null ? utente.getDataNascita().toString() : ""
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
