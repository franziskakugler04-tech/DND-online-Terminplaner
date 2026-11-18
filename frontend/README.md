# CampaignConnect — React + Vite

Voll klickbarer Prototyp aus dem Figma „CampaignConnect" (Terminplaner für Tabletop-RPG-Gruppen).

## Setup

```bash
npm install
npm run dev
```

Öffnet [http://localhost:5173](http://localhost:5173).

## Tests

```bash
npm test
```

## Struktur

```
src/
├── App.jsx                    # Routing + Theme/Tweaks-State
├── main.jsx                   # React mount
├── styles/
│   ├── tokens.css             # Farben, Schatten, Radii (CSS Custom Props)
│   └── app.css                # Reset + globale Helfer
├── data/
│   ├── mockData.js            # Termine, Gruppen, Freunde, Umfragen
│   └── i18n.js                # DE / EN Strings
├── components/
│   ├── atoms/                 # Avatar, Button, Icon, Logo
│   │   ├── Avatar.jsx + .module.css
│   │   ├── Button.jsx + .module.css
│   │   ├── Icon.jsx
│   │   └── Logo.jsx + .module.css
│   ├── molecules/             # AnfrageCard, Calendar, ChatListItem,
│   │   │                      # FreundCard, GruppenCard, NavItem,
│   │   │                      # PollCard, TerminCard
│   │   └── *.jsx + *.module.css
│   └── organisms/             # Header, Footer, Sidebar, TweaksPanel
│       └── *.jsx + *.module.css
└── screens/
    ├── Questboard.jsx         # Startseite
    ├── Community.jsx          # Gruppen-Suche
    ├── NeuerTermin.jsx        # Wizard
    ├── Profil.jsx             # Benutzerprofil
    └── Branding.jsx           # Logo + Voice
```

## Features

- **Voll klickbar:** Termine annehmen/ablehnen, Umfragen abstimmen, Anfragen verwalten, Drag & Drop für Termin-Reihenfolge.
- **5 Screens:** Questboard, Community, Neuer Termin, Profil, Branding.
- **Tweaks-Panel** (rechts unten):
  - Theme: Hell / Dunkel
  - Akzentfarbe: Orange / Violett / Smaragd / Rose / Cyan
  - RPG-Theming: An / Aus (W20-Würfel + Koulen-Display-Font)
  - Sprache: DE / EN
  - Termin-Karten-Layout: 3 Varianten
- **Fluid responsive** — `clamp()` und `auto-fill` Grids.
- **Atomic Design** — Atoms / Molecules / Organisms / Screens.

## Design-Tokens (aus Figma extrahiert)

| Token | Wert |
|---|---|
| `--cc-orange` | `#E9A051` |
| `--cc-orange-deep` | `#B45127` |
| `--cc-ink` | `#1D1B20` |
| `--cc-dark-plum` | `#2D2139` |
| `--cc-dark-night` | `#13101B` |
| Display | Koulen |
| UI | Roboto |
