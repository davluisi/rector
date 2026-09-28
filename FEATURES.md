# 📋 Rector - Funzionalità e Stato di Avanzamento

Questo documento elenca le funzionalità attuali dell'applicazione **Rector** (Backend e Frontend), lo stato di avanzamento e i prossimi sviluppi pianificati. È pensato per consultare rapidamente dove è arrivato lo sviluppo e aggiornarlo mano a mano che vengono aggiunte nuove funzionalità.

---

## 🎨 Rector - Brand Identity & Palette Colori
I tre colori fondamentali dell'applicazione sono:
- **Nero (Sfondo / Base)**: `#0E0E10` (Dark UI, carte su `#18181C`, bordi `#282830`)
- **Giallo Rector (Giallo/Oro del logo)**: `#FFB430` (Focus input, highlight primari, link, accenti positivi)
- **Rosso Rector (Rosso bordeaux del logo)**: `#A0132C` (Badge profilo, pulsanti attivi, categorie, pulsanti di azione, avvisi)

---

## 🟢 1. Funzionalità Completate

### ☕ Backend (Spring Boot API)
- [x] **Autenticazione & Registrazione Utenti (`AuthController`)**
  - Registrazione differenziata per tipologia utente: **Atleta** e **Personal Trainer**.
  - Login con validazione credenziali ed invio risposta con token/dettagli utente.
  - Generazione e invio di codice **OTP via Email** per la verifica dell'account/email.
  - Verifica del codice OTP inserito dall'utente.
  - Verifica esistenza email per reimpostazione password (`/api/auth/invia-link-reset`).
  - Gestione profilazione: salvataggio dati anagrafici (nome, cognome, genere, email, password hashed).
  - Gestione specifica Personal Trainer: caricamento e salvataggio URL del certificato di qualifica e dell'immagine di profilo.
- [x] **Gestione File & Upload (`FileController`)**
  - Endpoint per l'upload e il download di file (immagini di profilo, certificati in formato PDF/Doc).
  - Storage locale dei file caricati.
- [x] **Status Check (`StatusController`)**
  - Endpoint di diagnostica e salute API (`/api/status`).

---

### 📱 Frontend (React Native / Expo App)
- [x] **Rilevamento Automatico Backend (`config.js`)**
  - Auto-discovery dell'IP di rete locale per connettere automaticamente l'app al server Spring Boot (`http://<IP_LOCALE>:8080`).
- [x] **Navigazione & Layout Principale (`App.js`)**
  - Tab Bar inferiore personalizzata con 3 sezioni principali:
    - **Mondo (World)**: Home screen con vetrina dei professionisti.
    - **Allenamenti (Barbell)**: Sezione dedicata alle schede d'allenamento dell'atleta.
    - **Profilo / Login**: Schermata utente o form di autenticazione.
  - Gestione area sicura con `react-native-safe-area-context`.
- [x] **Home / Vetrina Professionisti (`components/`)**
  - **HeroSection**: Banner introduttivo ed estetico della piattaforma.
  - **SearchBar**: Barra di ricerca per filtrare personal trainer per nome o disciplina.
  - **FilterSelector**: Selector orizzontale a scorrimento rapido per categorie (es. *Bodybuilding*, *Dimagrimento*, *Funzionale*, *Pilates*).
  - **TrainerCard**: Schede dei Personal Trainer con foto, specialità, valutazione stelline e prezzo orario.
- [x] **Autenticazione & Profilo Utente (`components/AuthScreen.js` & `ProfileScreen.js`)**
  - Switch dinamico tra **Login** e **Registrazione**.
  - Form di registrazione multi-step per Atleta e Personal Trainer.
  - Inserimento ed invio codice OTP inviato tramite email.
  - Selector per l'immagine del profilo (tramite `expo-image-picker`).
  - Upload file certificato per i Personal Trainer (tramite `expo-document-picker`).
  - Visualizzazione e modifica delle informazioni del profilo utente loggato.

---

## 🟡 2. Funzionalità In Corso / Prossimi Passi (Roadmap)

- [ ] **Perfezionamento Visualizzazione & Anteprima PDF**
  - Ottimizzazione della preview in-app dei documenti e certificazioni in formato PDF (Android Scoped Storage / PDF reader dedicato).
- [ ] **Sezione Schede Allenamento (Barbell)**
  - Collegamento al backend per scaricare e visualizzare le schede d'allenamento assegnate al singolo Atleta dal suo PT.
  - Creazione ed editing delle schede lato Personal Trainer.
- [ ] **Integrazione Vetrina PT con Backend**
  - Sostituzione dei dati mockati dei Trainer nella Home con le API reali del backend (fetch elenco Personal Trainer dal DB).
- [ ] **Ricerca e Filtri Dinamici**
  - Filtraggio in tempo reale dei PT lato backend in base a categoria/specialità e prezzo.
- [ ] **Sistema di Chat / Messaggistica**
  - Comunicazione diretta via chat o messaggi tra Atleta e il proprio Personal Trainer.
- [ ] **Gestione Incarichi & Pagamenti**
  - Richiesta di consulenza/affiancamento da parte dell'Atleta a un Personal Trainer e gestione abbonamento.

---

## 📝 Come Mantenere Aggiornato Questo File

Quando aggiungi o completi una nuova funzionalità:
1. Sposta la relativa voce da **Prossimi Passi (Roadmap)** a **Funzionalità Completate**.
2. Aggiungi il spunta `[x]` alla casella di controllo.
3. Se crei nuovi controller nel backend o nuovi componenti nel frontend, elendali brevemente nelle rispettive sezioni.
