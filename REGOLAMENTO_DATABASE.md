# Regolamento per le Modifiche al Database (MondoPT)

Per garantire la coerenza del database tra tutti gli ambienti di sviluppo, test e produzione, è obbligatorio seguire la seguente regola fondamentale:

> [!IMPORTANT]
> **NON MODIFICARE MAI IL DATABASE DIRETTAMENTE.**
> Qualsiasi modifica allo schema (creazione/modifica di tabelle, colonne, indici, vincoli o inserimento di dati strutturali) **non deve mai essere eseguita manualmente o tramite tool di database** (come pgAdmin, DBeaver, ecc.).

---

## Procedura per le Modifiche

Ogni volta che è necessaria una modifica al database, segui questi passaggi:

1. **Crea un nuovo file SQL** di migrazione (changeset) all'interno della cartella:
   `database/liquibase/changelog/`
   *Esempio: `database/liquibase/changelog/002-add-phone-to-users.sql`*

2. **Registra il changeset** all'interno del file master:
   [db.changelog-master.xml](file:///c:/Progetti/MondoPT/database/liquibase/db.changelog-master.xml)
   *Esempio di inserimento:*
   ```xml
   <changeSet id="002-add-phone-to-users" author="sviluppatore">
       <sqlFile path="changelog/002-add-phone-to-users.sql" relativeToChangelogFile="true" />
   </changeSet>
   ```

3. **Riavvia il Backend**:
   Al riavvio del backend Spring Boot, Liquibase rileverà automaticamente il nuovo script e lo applicherà al database in modo sicuro e tracciato.
