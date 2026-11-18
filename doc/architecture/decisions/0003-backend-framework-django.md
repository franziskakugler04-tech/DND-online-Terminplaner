# 3. Backend-Framework: Django

Date: 2026-04-15

## Status

Accepted

## Context

Das Backend muss eine REST-API bereitstellen, Datenbankzugriffe verwalten und Authentifizierung abbilden. Das Team hat Python-Kenntnisse. Schnelle Entwicklung hat Priorität.

## Decision

Wir verwenden Django (mit Django REST Framework) als Backend, da es batteries-included ist, ein mächtiges ORM für MySQL mitbringt und Admin-Interface, Auth und Migrations out-of-the-box liefert.

## Consequences

- ORM, Migrations, Auth out-of-the-box
- Django Admin für schnelle Datenpflege
- Synchrones Request-Handling (kein natürliches async)
- Schwergewichtiger als Micro-Frameworks 
