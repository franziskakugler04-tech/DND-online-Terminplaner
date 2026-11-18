# 7. API-Dokumentation: drf-spectacular

Date: 2026-06-11

## Status

Accepted

## Context

Das Backend stellt eine REST-API bereit, die von Frontend-Entwicklern im Entwicklungsprozess verwendet werden kann. Ohne maschinenlesbare API-Dokumentation müssen Endpunkte, Parameter und Antwortstrukturen manuell gepflegt werden, was fehleranfällig ist und den Entwicklungsaufwand erhöht.

## Decision

Wir verwenden **drf-spectacular** zur automatischen Generierung einer API-Dokumentation aus den vorhandenen Django REST Framework Views und Serializers. Die Spezifikation wird unter `/api/schema/` bereitgestellt; eine interaktive Swagger-UI ist unter `/api/docs/` erreichbar.

## Consequences

- API-Dokumentation wird automatisch aus dem Code generiert
- Kein manueller Pflege Aufwand nötig
- Swagger-UI ermöglicht direktes Testen der API im Browser
- Frontend-Entwickler können Client-Code aus dem Schema generieren
- Zusätzliche Abhängigkeit im Projekt
