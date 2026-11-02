# Rector 🏋️‍♂️💪

Rector è una piattaforma moderna progettata per connettere **atleti** e **personal trainer**. Consente agli atleti di trovare il professionista ideale per le proprie esigenze e ricevere schede e programmi di allenamento personalizzati.

> [!NOTE]
> **Stato del Progetto**: Il progetto è attualmente in fase attiva di sviluppo (Work in Progress). Diverse funzionalità chiave (es. questionario di matching, gestione ed esecuzione schede di allenamento, piani tariffari personalizzati, chat in-app) sono in corso di definizione ed implementazione. Consulta [FEATURES.md](file:///c:/Progetti/rector/FEATURES.md) per l'elenco completo delle funzionalità previste e completate.

---

## 🚀 Stack Tecnologico & Architettura Cloud

Il progetto adotta un'architettura modulare e scalabile:

### 📱 Frontend (App Mobile)
*   **Framework**: [React Native](https://reactnative.dev/) con [Expo (SDK 57)](https://expo.dev/)
*   **Stile**: [Tailwind CSS](https://tailwindcss.com/) tramite [NativeWind v4](https://www.nativewind.dev/)
*   **Animazioni**: [React Native Reanimated v4](https://docs.swmansion.com/react-native-reanimated/)
*   **Icone**: `@expo/vector-icons` (Ionicons)

### ☕ Backend (API Service)
*   **Linguaggio**: Java 17
*   **Framework**: [Spring Boot](https://spring.io/projects/spring-boot) (Spring Web, Spring Security, Spring Data JPA)
*   **Database Migration**: [Liquibase](https://www.liquibase.org/) con changelog strutturati
*   **AWS SDK for Java v2**: Integrazione per la gestione dei servizi cloud

### ☁️ Servizi Cloud (Amazon Web Services)
*   **Amazon S3 (Simple Storage Service)**: Archiviazione sicura e scalabile di file multimediali, immagini di profilo, documenti di certificazione e video degli esercizi.
*   **Amazon CloudFront**: Content Delivery Network (CDN) per la distribuzione rapida, sicura e a bassa latenza dei contenuti multimediali ospitati su S3.

### 🗄️ Database
*   **Motore**: [PostgreSQL](https://www.postgresql.org/)
*   **Gestione e Deployment**: Containerizzato tramite Docker & Docker Compose

---

## 📁 Struttura del Progetto

```text
Rector/
├── backend/          # Sorgenti dell'API in Spring Boot (Java)
├── frontend/         # Applicazione mobile Expo/React Native (Javascript)
├── database/         # Configurazione PostgreSQL e script/changelog Liquibase
├── FEATURES.md       # Roadmap e riepilogo dettagliato delle funzionalità
├── run_be.bat        # Script batch per avviare il Backend
└── run_fe.bat        # Script batch per avviare il Frontend Expo
```
