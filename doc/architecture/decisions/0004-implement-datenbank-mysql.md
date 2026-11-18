# 4. Implement Datenbank: MySQL

Date: 2026-04-15

## Status

Accepted

## Context

Die Applikation hat klar relationale Datenstrukturen. Es werden ACID-Transaktionen benötigt. Die Infrastruktur wird durch eine lokale Instanz gehostet

## Decision

Wir verwenden MySQL als relationale Datenbank, da die Datenstrukturen tabellarisch sind, Django native MySQL-Unterstützung bietet und die Technologie im Team bekannt ist.

## Consequences

- Weit verbreitet, gute Django-Integration
- Weniger Feature-reich als PostgreSQL (kein JSONB, eingeschränkte Window Functions)
- Stricter Mode oft deaktiviert by default, muss konfiguriert werden