# CampainConnect – D&D Kampagnen- & Termin-Manager
## SWP-Team 2

## Beschreibung

Dieses Projekt ist ein Online-Terminbuchungs- und Gruppen-Management-Service, der speziell auf die Bedürfnisse von Pen & Paper Rollenspielern (insbesondere Dungeons & Dragons) zugeschnitten ist.

Da D&D ein kooperatives Gruppenspiel ist, das regelmäßige Treffen, Vorbereitung und viel Kommunikation erfordert, löst diese Plattform die typischen organisatorischen Hürden. Sie richtet sich an zwei Hauptzielgruppen:

* **Gruppe A:** Spieler und Spielleiter (DMs), die noch eine Gruppe suchen (Matchmaking & One-Shot Börse).
* **Gruppe B:** Bestehende Gruppen, die ihre Termine, Kampagnen und Notizen zentral verwalten wollen.

## Tech-Stack

| Schicht | Technologie |
|---|---|
| Frontend | React 18 (Vite, SPA) |
| Backend | Python 3.12 / Django 6 + Django REST Framework |
| Datenbank | MySQL 8.0 |
| Containerisierung | Docker Compose |

## Rollen & Berechtigungen

* **Spielleiter (DM):** Kann Kampagnen anlegen, Termine planen, Quests verwalten, Notizen machen und Spieler einladen.
* **Spieler:** Können Termine einsehen, zu-/absagen, Verfügbarkeiten angeben und Recaps lesen.
* **Admins:** Rechteverwaltung, Moderation und allgemeines Gruppenmanagement.

## Kern-Features

### Termin- und Kampagnenverwaltung
* Terminerstellung für einmalige oder wiederkehrende Sessions
* Parallele Verwaltung mehrerer Kampagnen, One-Shots oder Events
* Terminfindung mit Umfrage-Funktion und automatischer Zeitzonen-Erkennung
* Session-Management mit Teilnehmerlimits und Wartelisten
* Automatische Erinnerungen an Termine

### Kampagnen-Logistik & Quest-Board
* Quest-Board mit Übersicht über aktive und abgeschlossene Quests
* Recaps & Zusammenfassungen pro Session
* Private DM-Notizen und öffentliche Gruppennotizen
* Story-Tracking verknüpft mit Terminen und Quests
* Integrierte Abstimmungen

### Spieler-Management
* Spielerübersicht inklusive Terminhistorie
* Charakterbögen mit Name, Klasse, Level und Volk
* Schnelle Anwesenheitsabfrage

### Community & Matchmaking
* Öffentliche Börse für One-Shots und Kampagnen
* Filterung nach Spielstil, Erfahrung und Format (Online/IRL)

### Kalender-Synchronisation
* Privater iCal-Feed pro Nutzer (alle eigenen Sessions als Kalender-Abo)
* Kompatibel mit Google Calendar, Apple Kalender, Outlook und allen iCal-fähigen Apps

### Kommunikation
* Gruppenchat innerhalb der Plattform
* Benachrichtigungen bei Terminänderungen und Bestätigungen

---

## Projekt starten (mit Docker)

> **Voraussetzung:** [Docker Desktop](https://www.docker.com/products/docker-desktop) installiert und gestartet.

### 1 — Repo klonen

```bash
git clone <repo-url>
cd swp-team2
```

### 2 — `.env` Datei anlegen

```bash
cp .env.example .env
```

Die `.env` Datei enthält die Zugangsdaten für die Datenbank diese bleibt **lokal** — sie wird nicht ins Git committed.

### 3 — Alles starten

```bash
docker compose up
```

Docker baut automatisch alle Images und startet die drei Container:

| Dienst | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Django Admin | http://localhost:8000/admin |

Die Datenbank-Migrationen werden beim ersten Start automatisch ausgeführt.

### Nützliche Befehle

```bash
# Beim ersten Start oder nach Änderungen an requirements.txt / package.json
docker compose up --build

# Im Hintergrund starten
docker compose up -d

# Alles stoppen
docker compose down

# Django Management Commands ausführen (z.B. Superuser anlegen)
docker compose exec backend python manage.py createsuperuser
```

---

## Kalender synchronisieren

1. Öffne die iCal-URL direkt im Browser (statt sie ins Kalender-Abo einzufügen):
http://localhost:5173/api/ical/<DEIN-TOKEN>/
→ Dabei wird eine .ics-Datei heruntergeladen.

2. Öffne die Kalender-App auf dem Mac.

3. Gehe oben auf Ablage → Importieren… und wähl die gerade geladene .ics-Datei aus.

4. Wähl aus, in welchen Kalender die Termine sollen, und bestätige.

5. Fertig — die Termine erscheinen sofort, inklusive der Erinnerung 1 Stunde vorher.

Wichtig: Das ist ein einmaliger Import, kein Abo — neue Termine aktualisieren sich also nicht automatisch. Das richtige URL-Abo funktioniert erst, wenn die App auf einem echten Server (mit HTTPS) deployed ist.


---

## Projektstruktur

```
swp-team2/
├── docker-compose.yml        # Orchestrierung aller Dienste
├── .env                      # Lokale Zugangsdaten (nicht im Git)
├── .env.example              # Vorlage für .env
├── backend/
│   ├── config/               # Django-Einstellungen und URLs
│   ├── campainConnect/       # Django App (Models, Views, Serializers)
│   ├── Dockerfile
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/                  # React Quellcode
│   ├── Dockerfile
│   └── package.json
└── doc/
    └── architecture/
        └── decisions/        # Architecture Decision Records (ADRs)
```

---

## Kalender-Synchronisation (iCal)

Jeder Nutzer hat einen persönlichen Kalender-Feed mit allen eigenen bestätigten Sessions.

Im **Questboard** auf den **Sync**-Button klicken — das Modal zeigt die Feed-URL an.

| Kalender-App | Schritt |
|---|---|
| Google Calendar | Einstellungen → Andere Kalender → Per URL hinzufügen |
| Apple Kalender | Datei → Neues Kalenderabonnement |
| Outlook | Kalender hinzufügen → Aus dem Internet abonnieren |

> Die Feed-URL enthält ein persönliches Token — nicht öffentlich teilen.

---

## Production-Deployment

> Konfiguration liegt bereit, ist aber **nicht aktiv**.

```bash
echo "ALLOWED_HOSTS=yourdomain.com" >> .env
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

| | Entwicklung | Produktion |
|---|---|---|
| Backend-Server | Django runserver | Gunicorn (4 Worker) |
| Frontend | Vite Dev-Server | Multi-stage Build → nginx |
| Ports nach außen | 5173, 8000 | nur 80 |

---

## Wichtige Hinweise

| Datei | Im Git | Zweck |
|---|---|---|
| `.env.example` | ✅ | Vorlage für Umgebungsvariablen |
| `.env` | ❌ | Echte Zugangsdaten, nur lokal |
| `backend/.env` | ❌ | Zugangsdaten für lokale Entwicklung ohne Docker |

---

## Tests ausführen

> **Voraussetzung:** Docker Desktop muss laufen.

### Backend-Tests

Beim ersten Mal (oder nach Änderungen an `requirements.txt`) das Image neu bauen:

```bash
docker compose build backend
```

Einzelne Testdatei ausführen:

```bash
# SCRUM-88: Datenbank-Constraints & Default-Werte
docker compose run --rm backend python -m pytest campainConnect/test_constraints.py -v

# SCRUM-90: Session-Erstellung validieren
docker compose run --rm backend python -m pytest campainConnect/test_session_erstellen.py -v
```

Alle Tests auf einmal:

```bash
docker compose run --rm backend python -m pytest -v
```

### Verwendung von KI-Werkzeugen

Im Rahmen des Projekts wurden folgende KI-gestützte Werkzeuge eingesetzt:

- **Generierung von Kommentaren** – Inline-Dokumentation und Docstrings wurden mithilfe von Claude Code (Sonnet 4.6) erstellt und ergänzt.
- **Refactoring des eigenen Codes** – Eigenständig geschriebener Code wurde mit Unterstützung von Claude Code (Opus 4.8) überarbeitet und verbessert.
- **Generierung der README-Datei** – Diese README wurde auf Basis des GitLab-Repositorys mit Claude Code (Sonnet 4.6) generiert.
- **Erzeugung eines ersten Frontend-Grundgerüsts** – Basierend auf den Figma-Mockups wurde mithilfe von Claude Code eine initiale Komponentenstruktur generiert.
> **Verwendeter Prompt:**
  > *„Analysiere die beigefügten Figma-Mockup-Screenshots und erstelle daraus ein erstes React-Komponentengerüst. Lege dabei die Dateistruktur, Komponentenhierarchie und grundlegendes CSS-Styling an. Fokussiere dich auf Layout und Struktur, noch nicht auf Logik oder API-Anbindung."*

Auf die Generierung von gesamten Code-Bestandteilen wird in den einzelnen Reflexionsberichten individuell eingegangen.

---

*Die Struktur und der Aufbau dieser README wurden mit Unterstützung von Claude Opus 4.8 (Anthropic) erstellt.*
