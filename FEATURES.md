# 📋 Rector - Funzionalità e Stato di Avanzamento

Questo documento elenca le funzionalità attuali dell'applicazione **Rector** (Backend e Frontend), lo stato di avanzamento e i prossimi sviluppi pianificati. È pensato per consultare rapidamente dove è arrivato lo sviluppo e aggiornarlo mano a mano che vengono aggiunte nuove funzionalità.

---

## 🎨 Rector - Brand Identity & Palette Colori
I tre colori fondamentali dell'applicazione sono:
- **Nero (Sfondo / Base)**: `#0E0E10` (Dark UI, carte su `#16161A`, bordi `#282830`)
- **Giallo Rector (Giallo/Oro del logo)**: `#FEB32F` / `#FFB430` (Focus input, highlight primari, link, accenti positivi, stelle recensioni)
- **Rosso/Bordeaux Rector**: `#A0132C` (Logout, badge profilo, pulsanti di azione ed eliminazione, avvisi)
- **Cyan**: `#00F0FF` (Highlight secondario / testi d'impatto)

---

## 🟢 1. Funzionalità Completate

### ☕ Backend (Spring Boot & Liquibase)
- [x] **Database & Migrazioni Liquibase (`database/liquibase/changelog/`)**
  - Schema gestito rigorosamente tramite changeset XML numerati progressivamente a 4 cifre (`0001` - `0011`) con inclusione nel master changelog.
  - Tabelle gestite con nomenclatura al singolare (`utente`, `utente_atleta`, `personal_trainer`, `otp_verifica`, `gruppo_esercizio`, `video_esercizio`, `atleta_personal_trainer`, `specializzazione`, `personal_trainer_specializzazione`, `recensione`).
- [x] **Autenticazione & Registrazione Utenti (`AuthController`)**
  - Registrazione differenziata per tipologia utente: **Atleta** e **Personal Trainer**.
  - Login con validazione credenziali ed invio risposta con dati utente completi (ruolo, dati anagrafici, stato admin, PT seguiti, specializzazioni).
  - Generazione e invio di codice **OTP via Email** per la verifica dell'account/email (`OtpVerifica`).
  - Reimpostazione e cambio password con verifica OTP.
  - Verifica documenti PT con scadenza, fronte e retro.
- [x] **Pannello Admin & Gestione Approvazioni (`AdminController`)**
  - Verifica e approvazione o rifiuto delle candidature dei Personal Trainer da parte degli amministratori.
  - Assegnazione e rimozione delle relazioni atleta - personal trainer.
- [x] **Archivio Esercizi del Personal Trainer (`ArchivioController`)**
  - Creazione e gestione di gruppi/cartelle di esercizi (`GruppoEsercizio`).
  - Caricamento, modifica ed eliminazione di video esercizi (`VideoEsercizio`) con generazione di anteprima immagine (`anteprimaVideo`).
- [x] **Catalogo Specializzazioni (`Specializzazione` & `AuthController`)**
  - Catalogo globale delle specializzazioni ordinate alfabeticamente.
  - Assegnazione fino a un massimo di 5 specializzazioni per ciascun Personal Trainer (`PUT /api/auth/pt/{idPt}/specializzazioni`).
- [x] **Vetrina e Ricerca Personal Trainer Verificati (`AuthController`)**
  - Endpoint `GET /api/auth/personal-trainers/verificati` con supporto a filtri combinati per ID specializzazioni e range di età (`etaMin`, `etaMax`).
  - **Algoritmo di Ordinamento con Media Bayesiana**: classifica dinamica basata su punteggio ponderato tra numero di recensioni reali e media voto, con collocazione bilanciata per i nuovi trainer a 0 recensioni e spareggio alfabetico.
- [x] **Sistema di Recensioni (`Recensione` & `RecensioneController`)**
  - Vincolo di unicità: un atleta può lasciare una sola recensione (valutazione da 1 a 5 stelle + commento opzionale) per ciascun PT, con possibilità di modifica.
  - Vincolo di autorizzazione: solo gli atleti con abbonamento/relazione attiva con il PT possono recensirlo.
  - Calcolo e aggregazione statistiche (media voti e conteggio recensioni) con `RecensioneRepository`.
- [x] **Gestione File & Upload (`FileController` & `FileStorageService`)**
  - Upload e download di immagini di profilo, documenti PDF/immagini del trainer e video/anteprime con storage locale e serving sicuro.
- [x] **Status Check (`StatusController`)**
  - Endpoint di diagnostica e salute API (`/api/status`).

---

### 📱 Frontend (React Native / Expo App)
- [x] **Rilevamento Automatico Backend (`config.js`)**
  - Auto-discovery dinamico dell'IP di rete locale per connettere automaticamente l'app al server Spring Boot (`http://<IP_LOCALE>:8080`).
- [x] **Navigazione & Layout Principale (`App.js`)**
  - Tab Bar inferiore personalizzata con 3 sezioni principali:
    - **Home (Icona Casa)**: Home screen personalizzata in base al ruolo (Atleta o PT).
    - **Allenamenti (Icona Scheda)**: Sezione dedicata alle schede d'allenamento.
    - **Profilo / Login**: Schermata utente o form di autenticazione multi-step.
  - Rendering istantaneo senza glitch al login/logout tramite key dinamica su `HomeScreen`.
- [x] **Home Utente & Vetrina PT (`HomeScreen.js`)**
  - **Vista Atleta con PT attivo**:
    - Mostra il banner "Il tuo Personal Trainer" (o "I tuoi Personal Trainer" se multipli) con foto, nome, stelle, specializzazioni.
    - Pulsante "Abbonamento" e pulsante "Recensione" (apre `ReviewModal`).
    - Pulsante rapido verso le schede d'allenamento.
    - Pulsante a fisarmonica **"Vedi altri Personal Trainer"** per estendere verso il basso la lista completa con i filtri.
  - **Vista Atleta senza PT / Visitatore**:
    - Testata "Trova il personal trainer più adatto a te".
    - Icona filtri con badge indicatore filtri attivi.
    - Elenco card dei trainer verificati con RatingStars (5 stelle a riempimento parziale/continuo decimale, es. 4.3).
    - Caricamento ottimizzato: eliminazione del flash di "Nessun risultato" e debounce dello spinner a 3 secondi per risposte rapide.
  - **Vista Personal Trainer**:
    - Dashboard dedicata "Home Personal Trainer".
- [x] **Sistema di Valutazione a Stelle (`RatingStars.js`)**
  - Componente grafico per mostrare 5 stelle con mascheratura e frazionamento percentuale continuo per qualsiasi decimale.
- [x] **Modale di Recensione (`ReviewModal.js`)**
  - Popup interattivo per atleti: selezione da 1 a 5 stelle e commento testuale, con caricamento automatico della recensione già salvata per la modifica.
- [x] **Filtri di Ricerca Dinamici (`FilterModal.js` & `AgeRangeSlider.js`)**
  - Modale con selezione multi-filtro:
    - Specializzazioni con lista verticale a checkbox.
    - Età con slider a doppio cursore personalizzato (`AgeRangeSlider`).
- [x] **Gestione Specializzazioni PT (`PtSpecializzazioniScreen.js`)**
  - Schermata a layout fisso: header, contatore `selezionate x/5` e pulsante "Salva" ancorati, con lista interna a checkbox scorrevole.
- [x] **Archivio Esercizi PT (`ArchivioScreen.js`)**
  - Gestione gruppi ed upload video per i trainer.
- [x] **Pannello Amministratore (`AdminScreen.js`)**
  - Approvazione/rifiuto PT e abbinamento atleta-trainer.
- [x] **Profilo Utente & Conferma Logout (`ProfileScreen.js`)**
  - Visualizzazione e modifica dati anagrafici, cambio password.
  - Modal di conferma in stile dark prima di eseguire il logout dall'account.

---

## 🟡 2. Funzionalità In Corso / Prossimi Passi (Roadmap)

- [ ] **Questionario di Matching Intelligente per la Scelta del Personal Trainer**
  - Permettere a un utente di compilare un breve questionario guidato all'interno dell'app (es. obiettivi di fitness, livello di esperienza, disponibilità oraria/settimanale, tipologia di allenamento preferita, budget).
  - Algoritmo di raccomandazione/suggerimento che analizza le risposte e propone i migliori Personal Trainer compatibili presenti nel database.
- [ ] **Sezione Schede Allenamento (Workout)**
  - Collegamento al backend per scaricare e visualizzare le schede d'allenamento assegnate al singolo Atleta dal suo PT.
  - Creazione, gestione ed editing delle schede lato Personal Trainer.
- [ ] **Sistema di Gestione Abbonamenti e Piani**
  - Attivazione della funzionalità collegata al pulsante "Abbonamento" sulla card del trainer nella Home.
  - Gestione dei piani tariffari del trainer e iscrizione atleta.
- [ ] **Sistema di Chat / Messaggistica**
  - Comunicazione diretta via chat in-app tra Atleta e il proprio Personal Trainer.
- [ ] **Perfezionamento Visualizzazione & Anteprima PDF**
  - Ottimizzazione della preview in-app dei documenti e certificazioni in formato PDF.

---

## 📝 Come Mantenere Aggiornato Questo File

Quando aggiungi o completi una nuova funzionalità:
1. Sposta la relativa voce da **Prossimi Passi (Roadmap)** a **Funzionalità Completate**.
2. Aggiungi il spunta `[x]` alla casella di controllo.
3. Se crei nuovi controller nel backend o nuovi componenti nel frontend, elencali brevemente nelle rispettive sezioni.
