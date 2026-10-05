# Funzionalità

## DA FARE

- [ ] **Questionario di Matching Intelligente per la Scelta del Personal Trainer**
  - Compilazione questionario guidato per atleta (obiettivi, livello, disponibilità, tipologia allenamento, budget).
  - Algoritmo di raccomandazione con proposta dei migliori Personal Trainer compatibili.
- [ ] **Sezione Schede Allenamento (Workout)**
  - Visualizzazione ed esecuzione schede d'allenamento per l'atleta.
  - Creazione, gestione ed assegnazione schede lato Personal Trainer.
- [ ] **Piani Tariffari Personal Trainer**
  - Definizione e gestione dei piani/tariffe da parte del Personal Trainer.
  - Sottoscrizione con scelta del piano da parte dell'atleta.
- [ ] **Sistema di Chat / Messaggistica**
  - Chat diretta in-app tra Atleta e il proprio Personal Trainer.
- [ ] **Link Social nel Profilo dei Personal Trainer**
  - Inserimento e visualizzazione dei link ai canali social (Instagram, TikTok, YouTube, ecc.) nel profilo e nella pagina di dettaglio del trainer.

---

## COMPLETATE

- [x] **Visualizzazione & Anteprima Documenti PDF**
  - Visualizzazione e gestione anteprima in-app dei documenti e delle certificazioni in formato PDF.
- [x] **Database & Migrazioni Liquibase**
  - Struttura tabelle con nomenclatura al singolare (`utente`, `utente_atleta`, `personal_trainer`, `otp_verifica`, `gruppo_esercizio`, `video_esercizio`, `atleta_personal_trainer`, `specializzazione`, `personal_trainer_specializzazione`, `recensione`).
  - Changelog XML progressivi a 4 cifre inclusi nel master.
- [x] **Autenticazione & Registrazione Multi-Ruolo**
  - Flussi di registrazione distinti per Atleta e Personal Trainer.
  - Login con caricamento credenziali, permessi e profilo completo.
  - Invio e verifica codice OTP via email per registrazione, cambio email e recupero password.
  - Cambio password da area personale e reimpostazione con OTP.
- [x] **Gestione Profilo & Impostazioni Utente**
  - Struttura Impostazioni unificata per tutti gli utenti (Atleta e Personal Trainer).
  - Sezione Profilo per dati anagrafici e biometrici (nome, cognome, data di nascita, genere, altezza, peso) e foto profilo.
  - Sezione Account separata per modifica email (con OTP) e password.
  - Abilitazione/disabilitazione del profilo Atleta per i Personal Trainer con verifica abbonamenti attivi.
  - Logout con popup di conferma personalizzato.
- [x] **Archivio Esercizi Personal Trainer**
  - Creazione e gestione cartelle/gruppi di esercizi.
  - Caricamento, modifica ed eliminazione video esercizi con generazione di anteprima.
- [x] **Catalogo & Gestione Specializzazioni**
  - Gestione catalogo globale specializzazioni lato Amministratore (creazione, modifica nome con preservazione ID, cancellazione a cascata sicura).
  - Assegnazione fino a 5 specializzazioni per ciascun Personal Trainer con selezione di quella in evidenza.
- [x] **Pannello di Amministrazione (Admin)**
  - Dashboard statistiche (utenti, PT, abbonamenti).
  - Revisione e approvazione/rifiuto candidature Personal Trainer con verifica documenti (fronte/retro/scadenza).
  - Gestione catalogo specializzazioni.
  - Abbinamento manuale atleta - personal trainer.
- [x] **Vetrina e Ricerca Personal Trainer**
  - Visualizzazione elenco Personal Trainer verificati per gli atleti e visitatori.
  - Algoritmo di ordinamento con Media Bayesiana basato su recensioni e voti con spareggio alfabetico.
  - Ricerca testuale per nome e cognome.
  - Filtri combinati per specializzazioni e range di età (slider a doppio cursore).
  - Visualizzazione stelle con frazionamento percentuale continuo per qualsiasi decimale.
- [x] **Dettaglio Personal Trainer & Sottoscrizione Abbonamento**
  - Schermata di dettaglio con profilo, specializzazioni, età, bio e recensioni ricevute.
  - Pulsante per abbonarsi al Personal Trainer (con gestione stato per utenti non autenticati).
  - Schermata di gestione abbonamento attivo con possibilità di annullamento.
- [x] **Home Dinamica Multi-Ruolo**
  - Vista per atleti con PT attivo (banner con dettagli trainer, pulsante abbonamento e recensione, lista espandibile per vedere altri PT).
  - Vista per visitatori o atleti senza PT con testata di ricerca e catalogo.
  - Vista dashboard per Personal Trainer.
  - Switch rapido tra vista PT e vista Atleta per utenti con ruolo entrambi.
- [x] **Sistema di Recensioni**
  - Inserimento e modifica recensione da 1 a 5 stelle con commento opzionale per il proprio PT.
  - Calcolo e aggiornamento immediato della media voto e del conteggio recensioni nel backend e frontend.
  - Modale interattivo funzionante anche a tastiera aperta con popup di conferma centrato.
- [x] **Gestione File & Upload**
  - Upload sicuro su file system locale per foto profilo, documenti e video con anteprime.
  - Download e serving protetto dei file multimediali.
