# 2. Frontend-Framework: React

Date: 2026-04-15

## Status

Accepted

## Context

Das Projekt benötigt eine interaktive Single-Page-Application mit dynamischen UI-Komponenten. Das Entwicklungsteam hat Vorkenntnisse in JavaScript. Die Anwendung soll wartbar und gut testbar sein.

## Decision

Wir verwenden React als Frontend-Framework, da es ein großes Ökosystem, komponentenbasierte Architektur bietet. Die Wiederverwendbarkeit von Komponenten reduziert den Entwicklungsaufwand.

## Consequences

- Großes Ökosystem, viele fertige Bibliotheken
- Komponentenwiederverwendung spart Entwicklungszeit
- Build-Setup (Vite/Webpack) erforderlich
- Virtual DOM-Overhead bei sehr vielen Updates 
