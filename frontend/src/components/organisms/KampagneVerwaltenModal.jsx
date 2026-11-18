import React from 'react';
import Avatar from '../atoms/Avatar.jsx';
import Button from '../atoms/Button.jsx';

/* KampagneVerwaltenModal — Spielleiter sieht die Mitglieder seiner Kampagne
   und kann sie entfernen. */

export default function KampagneVerwaltenModal({ kampagne, onClose, onUpdated, onDeleted }) {
  const [mitglieder, setMitglieder] = React.useState([]);
  const [laden, setLaden] = React.useState(true);
  const [fehler, setFehler] = React.useState('');
  const [loeschBestaetigung, setLoeschBestaetigung] = React.useState(false);
  const [loeschenLaeuft, setLoeschenLaeuft] = React.useState(false);

  const [form, setForm] = React.useState({
    titel: kampagne.titel || '',
    beschreibung: kampagne.beschreibung || '',
    sonstiges: kampagne.sonstiges || '',
  });
  const [speichern, setSpeichern] = React.useState(false);
  const [gespeichert, setGespeichert] = React.useState(false);

  const headers = { Authorization: 'Bearer ' + localStorage.getItem('cc_access') };

  const setFeld = (k, v) => { setForm(f => ({ ...f, [k]: v })); setGespeichert(false); };

  const ladeMitglieder = React.useCallback(() => {
    setLaden(true);
    fetch(`/api/kampagnen/${kampagne.id}/mitglieder/`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(setMitglieder)
      .catch(() => setFehler('Mitglieder konnten nicht geladen werden.'))
      .finally(() => setLaden(false));
  }, [kampagne.id]);

  React.useEffect(() => { ladeMitglieder(); }, [ladeMitglieder]);

  const detailsSpeichern = async () => {
    setFehler('');
    setSpeichern(true);
    try {
      const res = await fetch(`/api/kampagnen/${kampagne.id}/`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Speichern fehlgeschlagen.');
      }
      const aktualisiert = await res.json();
      setGespeichert(true);
      onUpdated?.(aktualisiert);
    } catch (e) {
      setFehler(e.message);
    } finally {
      setSpeichern(false);
    }
  };

  const entfernen = async (spielerId) => {
    setFehler('');
    try {
      const res = await fetch(`/api/kampagnen/${kampagne.id}/mitglieder/${spielerId}/`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Entfernen fehlgeschlagen.');
      }
      setMitglieder(ms => ms.filter(m => m.spieler_id !== spielerId));
    } catch (e) {
      setFehler(e.message);
    }
  };

  const kampagneLoeschen = async () => {
    setFehler('');
    setLoeschenLaeuft(true);
    try {
      const res = await fetch(`/api/kampagnen/${kampagne.id}/`, { method: 'DELETE', headers });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Löschen fehlgeschlagen.');
      }
      onDeleted?.(kampagne.id);
      onClose();
    } catch (e) {
      setFehler(e.message);
      setLoeschenLaeuft(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--cc-surface)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,.3)', maxWidth: 520, width: '90%', maxHeight: '82vh', overflow: 'auto', padding: 28 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: 'var(--cc-text)' }}>Kampagne verwalten</h2>
            <div style={{ fontSize: 13, color: 'var(--cc-text-soft)', marginTop: 4 }}>{kampagne.titel}</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: 'var(--cc-text-soft)', lineHeight: 1 }}>×</button>
        </div>

        {fehler && (
          <div style={{ padding: 10, marginBottom: 14, borderRadius: 8, background: 'rgba(220,38,38,.1)', color: '#b91c1c', fontSize: 13 }}>{fehler}</div>
        )}

        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--cc-accent-deep)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
          Details bearbeiten
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          <Feld label="Titel">
            <input value={form.titel} onChange={e => setFeld('titel', e.target.value)} style={inputStyle} />
          </Feld>
          <Feld label="Beschreibung">
            <textarea rows={3} value={form.beschreibung} onChange={e => setFeld('beschreibung', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
          </Feld>
          <Feld label="Sonstiges">
            <textarea rows={2} value={form.sonstiges} onChange={e => setFeld('sonstiges', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
          </Feld>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button size="sm" variant="primary" onClick={detailsSpeichern} disabled={speichern}>
              {speichern ? 'Speichern…' : 'Speichern'}
            </Button>
            {gespeichert && <span style={{ fontSize: 12, color: 'var(--cc-accent-deep)' }}>✓ Gespeichert</span>}
          </div>
        </div>

        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--cc-accent-deep)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
          Mitglieder ({mitglieder.length})
        </h3>

        {laden ? (
          <p style={{ fontSize: 13, color: 'var(--cc-text-soft)' }}>Lädt…</p>
        ) : mitglieder.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--cc-text-soft)' }}>Noch keine Mitglieder.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mitglieder.map(m => (
              <div key={m.spieler_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px', borderBottom: '1px solid var(--cc-border-soft)' }}>
                <Avatar name={m.username} id={m.spieler_id} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: 'var(--cc-text)' }}>{m.username}</div>
                  {m.ist_spielleiter && (
                    <div style={{ fontSize: 11, color: 'var(--cc-accent-deep)', fontWeight: 600 }}>Spielleiter</div>
                  )}
                </div>
                {m.ist_spielleiter ? (
                  <span style={{ fontSize: 12, color: 'var(--cc-text-soft)' }}>Du</span>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => entfernen(m.spieler_id)}>
                    Entfernen
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--cc-border-soft)' }}>
          {loeschBestaetigung ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--cc-text)' }}>Kampagne wirklich löschen?</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button size="sm" variant="ghost" onClick={() => setLoeschBestaetigung(false)} disabled={loeschenLaeuft}>Abbrechen</Button>
                <button
                  onClick={kampagneLoeschen}
                  disabled={loeschenLaeuft}
                  style={{ border: 'none', borderRadius: 6, background: '#b91c1c', color: '#fff', fontSize: 13, fontWeight: 600, cursor: loeschenLaeuft ? 'default' : 'pointer', padding: '8px 14px', opacity: loeschenLaeuft ? 0.6 : 1 }}
                >
                  {loeschenLaeuft ? 'Löschen…' : 'Ja, löschen'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setLoeschBestaetigung(true)}
              style={{ border: 'none', background: 'transparent', color: '#b91c1c', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0' }}
            >
              Kampagne löschen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 11px', border: '1px solid var(--cc-border-soft)',
  borderRadius: 6, fontSize: 14, fontFamily: 'inherit',
  background: 'var(--cc-surface)', color: 'var(--cc-text)',
};

function Feld({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cc-text-soft)' }}>{label}</span>
      {children}
    </label>
  );
}
