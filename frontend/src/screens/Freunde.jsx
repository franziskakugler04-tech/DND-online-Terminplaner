import React from 'react';
import { freundeApi } from '../data/api.js';
import Avatar from '../components/atoms/Avatar.jsx';
import Button from '../components/atoms/Button.jsx';
import Icon from '../components/atoms/Icon.jsx';

/* Freunde — Verwaltung: Suche, Anfragen, Freundesliste. */

export default function Freunde() {
  const [query, setQuery] = React.useState('');
  const [suchTreffer, setSuchTreffer] = React.useState([]);
  const [freunde, setFreunde] = React.useState([]);
  const [fehler, setFehler] = React.useState('');

  const refreshAll = React.useCallback(async () => {
    try {
      const f = await freundeApi.liste();
      setFreunde(f);
    } catch (e) { console.error(e); }
  }, []);

  React.useEffect(() => { refreshAll(); }, [refreshAll]);

  React.useEffect(() => {
    window.addEventListener('cc:freundesliste-aktualisieren', refreshAll);
    return () => window.removeEventListener('cc:freundesliste-aktualisieren', refreshAll);
  }, [refreshAll]);

  /* Suche mit kleinem Debounce (250 ms), damit nicht jeder Tastendruck eine Query auslöst. */
  React.useEffect(() => {
    if (!query.trim()) { setSuchTreffer([]); return; }
    const timer = setTimeout(() => {
      freundeApi.suche(query).then(setSuchTreffer).catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const senden = async (empfaengerId) => {
    setFehler('');
    try {
      await freundeApi.anfrageSenden(empfaengerId);
      setSuchTreffer(treffer =>
        treffer.map(t => t.id === empfaengerId ? { ...t, beziehung_status: 'ausstehend' } : t)
      );
    } catch (e) {
      setFehler(e.message || 'Anfrage konnte nicht gesendet werden.');
    }
  };

  const ablehnenOderEntfernen = async (id) => {
    try {
      await freundeApi.loeschen(id);
      await refreshAll();
    } catch (e) { setFehler(e.message); }
  };

  return (
    <div style={{ padding: "32px 32px 0", maxWidth: 1100, margin: "0 auto" }}>
      <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 48px)", margin: 0, marginBottom: 24 }}>
        Freunde
      </h1>

      {fehler && (
        <div style={{
          padding: 12, marginBottom: 16, borderRadius: 8,
          background: 'rgba(220,38,38,.1)', color: '#b91c1c', fontSize: 13,
        }}>{fehler}</div>
      )}

      {/* Suche */}
      <Card title="Spieler finden">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Username eingeben..."
          style={{
            width: '100%', padding: '10px 12px', fontSize: 14,
            border: '1px solid var(--cc-border-soft)', borderRadius: 8,
            background: 'var(--cc-surface)', color: 'var(--cc-text)',
          }}
        />
        {suchTreffer.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suchTreffer.map(s => (
              <Row key={s.id}>
                <Avatar name={s.username} id={s.avatarId} size={36} />
                <div style={{ flex: 1, fontSize: 14 }}>{s.username}</div>
                {s.beziehung_status === 'angenommen' && (
                  <span style={tag()}>Bereits befreundet</span>
                )}
                {s.beziehung_status === 'ausstehend' && (
                  <span style={tag()}>Anfrage offen</span>
                )}
                {!s.beziehung_status && (
                  <Button size="sm" variant="primary" onClick={() => senden(s.id)}>
                    Anfrage senden
                  </Button>
                )}
              </Row>
            ))}
          </div>
        )}
      </Card>

      {/* Freundesliste */}
      <Card title={`Deine Freunde (${freunde.length})`}>
        {freunde.length === 0 && <Empty>Noch keine Freunde — finde welche oben!</Empty>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {freunde.map(f => (
            <Row key={f.id}>
              <Avatar name={f.spieler.username} id={f.spieler.avatarId} size={36} />
              <div style={{ flex: 1, fontSize: 14 }}>{f.spieler.username}</div>
              <Button size="sm" variant="ghost" onClick={() => ablehnenOderEntfernen(f.id)}>
                Entfernen
              </Button>
            </Row>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{
      background: 'var(--cc-surface)', border: '1px solid var(--cc-border-soft)',
      borderRadius: 14, padding: 18, marginBottom: 16,
    }}>
      <h3 style={{
        margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 700,
        color: 'var(--cc-accent-deep)', textTransform: 'uppercase', letterSpacing: '.06em',
      }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 4px', borderBottom: '1px solid var(--cc-border-soft)',
    }}>{children}</div>
  );
}

function Empty({ children }) {
  return <div style={{ fontSize: 13, color: 'var(--cc-text-soft)', padding: '4px' }}>{children}</div>;
}

function tag() {
  return {
    padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
    background: 'rgba(233,160,81,.12)', color: 'var(--cc-accent-deep)',
  };
}
