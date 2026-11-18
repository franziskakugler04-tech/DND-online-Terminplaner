import React from 'react';
import { getI18n } from '../../data/i18n.js';
import headerLogo from '../../assets/logosammlung-03.png';
import NavItem from '../molecules/NavItem.jsx';
import Icon from '../atoms/Icon.jsx';

/* Header — dunkler Plum-Streifen mit Logo + Nav. */

export default function Header({ active, onNavigate, user, onLogout }) {
  const i18n = getI18n(/*lang*/null || "de");
  const [beitrittsanfragen, setBeitrittsanfragen] = React.useState([]);
  const [freundAnfragen, setFreundAnfragen] = React.useState([]);
  const [mitteilungen, setMitteilungen] = React.useState([]);
  const [glockeOffen, setGlockeOffen] = React.useState(false);

  React.useEffect(() => {
    const headers = { Authorization: 'Bearer ' + localStorage.getItem('cc_access') };
    const laden = () => {
      fetch('/api/beitrittsanfragen/', { headers })
        .then(r => r.ok ? r.json() : [])
        .then(setBeitrittsanfragen)
        .catch(() => {});
      fetch('/api/freundschaftsanfragen/', { headers })
        .then(r => r.ok ? r.json() : [])
        .then(setFreundAnfragen)
        .catch(() => {});
      fetch('/api/benachrichtigungen/', { headers })
        .then(r => r.ok ? r.json() : [])
        .then(setMitteilungen)
        .catch(() => {});
    };
    laden();
    const interval = setInterval(laden, 30000);
    return () => clearInterval(interval);
  }, []);

  const mitteilungLoeschen = (id) => {
    fetch(`/api/benachrichtigungen/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('cc_access') },
    })
      .then(r => (r.ok || r.status === 204) ? setMitteilungen(m => m.filter(x => x.id !== id)) : null)
      .catch(() => {});
  };

  const beitrittsBearbeiten = (id, aktion) => {
    fetch(`/api/beitrittsanfragen/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('cc_access') },
      body: JSON.stringify({ aktion }),
    })
      .then(r => r.ok ? setBeitrittsanfragen(a => a.filter(x => x.id !== id)) : null)
      .catch(() => {});
  };

  const freundBearbeiten = (id, aktion) => {
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('cc_access') };
    if (aktion === 'annehmen') {
      fetch(`/api/freundschaften/${id}/`, { method: 'PUT', headers, body: JSON.stringify({ aktion: 'annehmen' }) })
        .then(r => {
          if (!r.ok) return;
          setFreundAnfragen(a => a.filter(x => x.id !== id));
          window.dispatchEvent(new CustomEvent('cc:freundesliste-aktualisieren'));
        })
        .catch(() => {});
    } else {
      fetch(`/api/freundschaften/${id}/`, { method: 'DELETE', headers })
        .then(r => r.ok ? setFreundAnfragen(a => a.filter(x => x.id !== id)) : null)
        .catch(() => {});
    }
  };

  const gesamtAnzahl = beitrittsanfragen.length + freundAnfragen.length + mitteilungen.length;

  const items = [
    { key: "questboard", label: i18n.nav.questboard },
    { key: "community", label: i18n.nav.community },
    { key: "freunde", label: "Freunde" },
    { key: "neuerTermin", label: "Neuer Termin" },
    { key: "neueKampagne", label: "Neue Kampagne" },
    { key: "profil", label: i18n.nav.profile },
  ];

  return (
    <header
      style={{
        background: "var(--cc-dark-plum)",
        color: "#fff",
        padding: "14px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        boxShadow: "0 2px 12px rgba(0,0,0,.2)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <button
        onClick={() => onNavigate("questboard")}
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "#fff",
          background: "transparent",
        }}
      >
        <div style={{ height: 46, width: 112, overflow: "hidden", flexShrink: 0, position: "relative" }}>
          <img
            src={headerLogo}
            alt="Campaign Connect Logo"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              height: 138,
              width: "auto",
              maxWidth: "none",
              transform: "translate(-50%, -50%)",
              display: "block",
            }}
          />
        </div>
        <span style={{ fontWeight: 700, letterSpacing: ".06em", fontSize: 20, color: "#fff", whiteSpace: "nowrap" }}>
          CAMPAIGN CONNECT
        </span>
      </button>
      <nav style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {items.map(it => (
          <NavItem
            key={it.key}
            label={it.label}
            active={active === it.key}
            onClick={() => onNavigate(it.key)}
          />
        ))}
      </nav>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <button
            title="Benachrichtigungen"
            style={iconBtn()}
            onClick={() => setGlockeOffen(o => !o)}
          >
            <Icon name="bell" size={18} />
            {gesamtAnzahl > 0 && (
              <span style={{
                position: "absolute", top: 2, right: 2,
                width: 16, height: 16, borderRadius: "50%",
                background: "#e74c3c", color: "#fff",
                fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{gesamtAnzahl}</span>
            )}
          </button>
          {glockeOffen && (
            <div style={{
              position: "absolute", top: 44, right: 0,
              width: 340, background: "var(--cc-surface)",
              border: "1px solid var(--cc-border-soft)", borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,.2)", zIndex: 100,
              overflow: "hidden",
            }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--cc-border-soft)", fontWeight: 600, fontSize: 14, color: "var(--cc-text)" }}>
                Benachrichtigungen {gesamtAnzahl > 0 && `(${gesamtAnzahl})`}
              </div>

              {gesamtAnzahl === 0 && (
                <div style={{ padding: 16, fontSize: 13, color: "var(--cc-text-soft)" }}>Keine neuen Benachrichtigungen</div>
              )}

              {freundAnfragen.length > 0 && (
                <>
                  <div style={{ padding: "8px 16px 4px", fontSize: 11, fontWeight: 700, color: "var(--cc-accent)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                    Freundschaftsanfragen
                  </div>
                  {freundAnfragen.map(a => (
                    <div key={a.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--cc-border-soft)", display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontSize: 13, color: "var(--cc-text)" }}>
                        <strong>{a.initiator.username}</strong> möchte deine Freundschaft
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => freundBearbeiten(a.id, 'annehmen')} style={acceptBtn()}>Annehmen</button>
                        <button onClick={() => freundBearbeiten(a.id, 'ablehnen')} style={declineBtn()}>Ablehnen</button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {beitrittsanfragen.length > 0 && (
                <>
                  <div style={{ padding: "8px 16px 4px", fontSize: 11, fontWeight: 700, color: "var(--cc-accent)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                    Beitrittsanfragen
                  </div>
                  {beitrittsanfragen.map(a => (
                    <div key={a.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--cc-border-soft)", display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontSize: 13, color: "var(--cc-text)" }}>
                        <strong>{a.spieler}</strong> möchte <strong>{a.kampagne}</strong> beitreten
                      </div>
                      <div style={{ fontSize: 11, color: "var(--cc-text-soft)" }}>{a.erstellt_am}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => beitrittsBearbeiten(a.id, 'annehmen')} style={acceptBtn()}>Annehmen</button>
                        <button onClick={() => beitrittsBearbeiten(a.id, 'ablehnen')} style={declineBtn()}>Ablehnen</button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {mitteilungen.length > 0 && (
                <>
                  <div style={{ padding: "8px 16px 4px", fontSize: 11, fontWeight: 700, color: "var(--cc-accent)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                    Mitteilungen
                  </div>
                  {mitteilungen.map(m => (
                    <div key={m.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--cc-border-soft)", display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "var(--cc-text)" }}>{m.text}</div>
                        <div style={{ fontSize: 11, color: "var(--cc-text-soft)", marginTop: 2 }}>{m.erstellt_am}</div>
                      </div>
                      <button onClick={() => mitteilungLoeschen(m.id)} title="Entfernen" style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: "var(--cc-text-soft)", lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <button title="Profil" style={iconBtn()} onClick={() => onNavigate("profil")}><Icon name="user" size={18} /></button>
        {onLogout && (
          <button
            title={`Abmelden (${user})`}
            onClick={onLogout}
            style={{ ...iconBtn(), fontSize: 11, fontWeight: 700, width: "auto", padding: "0 10px", borderRadius: 8, gap: 4 }}
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );

  function iconBtn() {
    return {
      width: 36, height: 36, borderRadius: "50%",
      background: "rgba(255,255,255,.08)", color: "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
    };
  }
  function acceptBtn() {
    return { flex: 1, padding: "4px 0", borderRadius: 6, border: "none", cursor: "pointer", background: "var(--cc-accent)", color: "var(--cc-ink)", fontWeight: 600, fontSize: 12 };
  }
  function declineBtn() {
    return { flex: 1, padding: "4px 0", borderRadius: 6, border: "none", cursor: "pointer", background: "var(--cc-dark-plum)", color: "#fff", fontWeight: 600, fontSize: 12 };
  }
}
