# Regolamento di Sviluppo (Rector)

Questo file definisce le linee guida e le regole vincolanti da seguire per lo sviluppo del progetto Rector.

---

## 1. Gestione del Database (Liquibase & JPA)

Per garantire l'integrità e la coerenza del database, segui queste regole tassative:

*   **MIGRAZIONI CON LIQUIBASE**: Qualsiasi creazione o modifica di tabelle, colonne, indici e vincoli deve essere definita tramite script di migrazione Liquibase inseriti in `database/liquibase/changelog/`.
*   **NOMENCLATURA DEI FILE (4 CIFRE)**: Tutti i file di migrazione di Liquibase devono iniziare con un numero intero progressivo a 4 cifre (es. `0001-creazione-tabella-utente.xml`).
*   **REGISTRAZIONE NEL MASTER**: Ciascun changeset deve essere registrato/incluso nel file master `database/liquibase/db.changelog-master.xml`.
*   **APPLICAZIONE TRAMITE BACKEND**: La migrazione viene eseguita automaticamente all'avvio del backend Spring Boot tramite la configurazione di Liquibase.
*   **NOMENCLATURA AL SINGOLARE**: Usiamo sempre nomi al singolare sia per le classi Java Entity sia per le tabelle corrispondenti nel database (es. entità `Utente` e `@Table(name = "utente")`).
*   **MAI MODIFICARE IL DB DIRETTAMENTE**: Nessuna modifica strutturale (ALTER TABLE, CREATE TABLE, ADD COLUMN, DROP, ecc.) deve essere fatta a mano sul database (pgAdmin, DBeaver, psql, o comandi diretti).

---

## 2. Gestione dei Commit e Push Git

Per mantenere il controllo totale sulla repository remota, è attiva la seguente regola operativa per l'assistente AI:

*   **DIVIETO DI PUSH AUTOMATICI**: L'assistente **non deve mai** eseguire operazioni di commit e push in autonomia durante lo sviluppo dei task.
*   **TRIGGER DI PUSH ("push")**: Il commit e il push vengono eseguiti **solo ed esclusivamente** quando l'utente scrive esplicitamente il messaggio **"push"** in chat.
*   **PROCEDURA DI PUSH**:
    1. L'utente scrive *"push"*.
    2. L'assistente prepara e propone un messaggio di commit in **italiano** che riassume le modifiche fatte.
    3. L'assistente **chiede esplicita conferma** all'utente sulla bontà del messaggio.
    4. Solo dopo che l'utente ha confermato positivamente il messaggio, l'assistente esegue il commit e il push sulla repository remota.

---

## 3. Architettura Frontend (React Native / Expo)

Per garantire la scalabilità e la pulizia del codice frontend:

*   **COMPONENTI MODULARI**: Evita di creare un unico file monolitico gigantesco (es. `App.js` enorme). Suddividi l'applicazione in componenti indipendenti, riutilizzabili e logicamente separati all'interno della cartella `components/` (es. `AuthModal.js`, `TrainerCard.js`).
*   **STYLING CON TAILWIND CSS**: Utilizza **Tailwind CSS** (tramite **NativeWind v4**) per lo styling delle interfacce tramite l'attributo `className`.
*   **NO STYLE SHEET**: Evita l'uso del classico `StyleSheet.create` di React Native per non frammentare la definizione dei layout e mantenere gli stili vicini alla struttura dei tag (utility-first).
*   **STILE MINIMAL E TEMA DARK**: Lo stile dell'applicazione deve essere sempre **MINIMAL** e utilizzare un tema **sempre dark** (scuro).

---

## 4. Lingua di Comunicazione

*   **RISPOSTE IN ITALIANO**: L'assistente deve rispondere e interagire **sempre in lingua italiana** con l'utente in chat.
