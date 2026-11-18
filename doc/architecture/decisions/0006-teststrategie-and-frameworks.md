# 6. Teststrategie und Frameworks

Date: 2026-05-05

## Status

Accepted

## Context

Unser Ziel ist es die Softwarequalität und die Benutzerfreundlichkeit auf möglichst hohem Niveau halten
## Decision

- Vitest + React Testing Library: Extrem schnell und fokussiert auf echtes Nutzerverhalten.
- pytest + pytest-django: Branchenstandard mit mächtigen Fixtures für effiziente        Datenbank-Tests.
- API-Mocking (MSW): Isoliert Frontend-Tests durch reales Abfangen von Netzwerkanfragen.
- Mocking (pytest-mock): Simuliert Abhängigkeiten für komplett isolierte Backend-Logik.

## Consequences

Erhöhter initialer Entwicklungsaufwand im Backend (durch das Schreiben und Pflegen der Tests).


