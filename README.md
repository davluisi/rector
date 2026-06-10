# MondoPT 🏋️‍♂️💪

MondoPT è una piattaforma moderna progettata per connettere **atleti** e **personal trainer**. Consente agli atleti di trovare il professionista ideale per le proprie esigenze e ricevere schede e programmi di allenamento personalizzati.

---

## 🚀 Stack Tecnologico

Il progetto è suddiviso in un'architettura modulare composta da frontend, backend e database:

### 📱 Frontend (App Mobile)
*   **Framework**: [React Native](https://reactnative.dev/) con [Expo (SDK 54)](https://expo.dev/)
*   **Stile**: [Tailwind CSS](https://tailwindcss.com/) tramite [NativeWind v4](https://www.nativewind.dev/)
*   **Animazioni**: [React Native Reanimated v4](https://docs.swmansion.com/react-native-reanimated/)
*   **Icone**: `@expo/vector-icons` (Ionicons)

### ☕ Backend (API Service)
*   **Linguaggio**: Java 17
*   **Framework**: [Spring Boot](https://spring.io/projects/spring-boot)
*   **Persistenza**: Spring Data JPA / Hibernate
*   **Database Connector**: PostgreSQL Driver

### 🗄️ Database
*   **Motore**: [PostgreSQL](https://www.postgresql.org/)
*   **Gestione e Deployment**: Containerizzato tramite Docker & Docker Compose

---

## 📁 Struttura del Progetto

```text
MondoPT/
├── backend/          # Sorgenti dell'API in Spring Boot (Java)
├── frontend/         # Applicazione mobile Expo/React Native (Javascript)
├── database/         # Configurazione PostgreSQL e script SQL di inizializzazione
├── run_be.bat        # Script batch per avviare il Backend
└── run_fe.bat        # Script batch per avviare il Frontend Expo
```

---

## 🛠️ Come Avviare il Progetto

### 1. Database (PostgreSQL)
Avvia l'istanza containerizzata del database tramite Docker Compose:
```bash
cd database
docker-compose up -d
```

### 2. Backend (Spring Boot)
Puoi avviare il backend tramite lo script batch fornito:
*   Fai doppio clic su `run_be.bat` nella root del progetto, oppure esegui:
    ```bash
    ./run_be.bat
    ```
*   Il backend sarà in ascolto su `http://localhost:8080`.

### 3. Frontend (Expo / React Native)
Avvia il server di sviluppo di Metro:
*   Fai doppio clic su `run_fe.bat` nella root del progetto, oppure esegui:
    ```bash
    ./run_fe.bat
    ```
*   Inquadra il QR code generato nel terminale utilizzando l'applicazione **Expo Go** sul tuo smartphone (iOS/Android) per testare l'app in tempo reale.
