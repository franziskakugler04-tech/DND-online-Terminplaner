# 5. Containerisierung mit Docker Compose

Date: 2026-05-13

## Status

Accepted

## Context

Das Projekt besteht aus drei voneinander abhängigen Komponenten: einem React-Frontend (Vite), einem Django-Backend und einer MySQL-Datenbank. Bisher mussten alle Teammitglieder diese drei Dienste manuell und separat lokal installieren und starten. Das führte zu Konfigurationsunterschieden zwischen Entwicklungsumgebungen.
## Decision

Wir verwenden Docker Compose zur Containerisierung aller drei Dienste. Jeder Dienst wird in einem eigenen Container betrieben und über eine `docker-compose.yml` im Projekt-Root orchestriert. Umgebungsvariablen werden über eine `.env`-Datei (lokal, nicht im Repository) injiziert. Ein `.env.example` dient als Template zum kopieren für alle Teammitglieder.

## Consequences

- Einheitliche Entwicklungsumgebung für alle Teammitglieder unabhängig vom Betriebssystem
- Onboarding reduziert sich auf: Docker Desktop installieren, `.env` anlegen, `docker compose up`
- MySQL-Migrationen werden beim Start automatisch ausgeführt
- Der MySQL-Container wartet über einen Healthcheck auf Betriebsbereitschaft bevor das Backend startet
- Datenbankdaten bleiben über Container-Neustarts hinweg erhalten (Docker Volume `mysql_data`)
- Lokale Installation von Python, Node.js oder MySQL ist für die Entwicklung nicht mehr erforderlich
- Änderungen an `requirements.txt` oder `package.json` erfordern ein `docker compose up --build`
