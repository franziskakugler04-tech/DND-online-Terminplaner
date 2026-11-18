import React from 'react';
import Button from '../atoms/Button.jsx';

/* TerminBearbeitenModal — Spielleiter bearbeitet Titel, Beschreibung und Ort
   einer Session nachträglich. */

export default function TerminBearbeitenModal({ termin, onClose, onSaved, onDeleted }) {
  const [form, setForm] = React.useState({
    titel: termin.titel || '',
    beschreibung: termin.description || '',
    ort: termin.location || '',
  });
  const [speichern, setSpeichern] = React.useState(false);
  const [loeschenLaeuft, setLoeschenLaeuft] = React.useState(false);
  const [loeschBestaetigung, setLoeschBestaetigung] = React.useState(false);
  const [fehler, setFehler] = React.useState('');

  const loeschen = async () => {
    setFehler('');
    setLoeschenLaeuft(true);
    try {
      const res = await fetch(`/api/termine/${termin.id}/`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('cc_access') },
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Löschen fehlgeschlagen.');
      }
      onDeleted?.(termin.id);
      onClose();
    } catch (e) {
      setFehler(e.message);
      setLoeschenLaeuft(false);
    }
  };

  const setFeld = (k, v) => { setForm(f => ({ ...f, [k]: v })); if (fehler) setFehler(''); };

  const speichernKlick = async () => {
    setFehler('');
    setSpeichern(true);
    try {
      const res = await fetch(`/api/termine/${termin.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('cc_access'),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Speichern fehlgeschlagen.');
      }
      const aktualisiert = await res.json();
      onSaved?.(aktualisiert);
      onClose();
    } catch (e) {
      setFehler(e.message);
    } finally {
      setSpeichern(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--cc-surface)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,.3)', maxWidth: 480, width: '90%', maxHeight: '82vh', overflow: 'auto', padding: 28 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--cc-text)' }}>Termin bearbeiten</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: 'var(--cc-text-soft)', lineHeight: 1 }}>×</button>
        </div>

        {fehler && (
          <div style={{ padding: 10, marginBottom: 14, borderRadius: 8, background: 'rgba(220,38,38,.1)', color: '#b91c1c', fontSize: 13 }}>{fehler}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Feld label="Titel">
            <input value={form.titel} onChange={e => setFeld('titel', e.target.value)} style={inputStyle} />
          </Feld>
          <Feld label="Beschreibung">
            <textarea rows={4} value={form.beschreibung} onChange={e => setFeld('beschreibung', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
          </Feld>
          <Feld label="Ort">
            <input value={form.ort} onChange={e => setFeld('ort', e.target.value)} style={inputStyle} />
          </Feld>
          {loeschBestaetigung ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--cc-text)' }}>Termin wirklich löschen?</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button size="sm" variant="ghost" onClick={() => setLoeschBestaetigung(false)} disabled={loeschenLaeuft}>Abbrechen</Button>
                <button
                  onClick={loeschen}
                  disabled={loeschenLaeuft}
                  style={{ border: 'none', borderRadius: 6, background: '#b91c1c', color: '#fff', fontSize: 13, fontWeight: 600, cursor: loeschenLaeuft ? 'default' : 'pointer', padding: '8px 14px', opacity: loeschenLaeuft ? 0.6 : 1 }}
                >
                  {loeschenLaeuft ? 'Löschen…' : 'Ja, löschen'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setLoeschBestaetigung(true)}
                style={{ border: 'none', background: 'transparent', color: '#b91c1c', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '6px 4px' }}
              >
                Termin löschen
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button size="sm" variant="ghost" onClick={onClose}>Abbrechen</Button>
                <Button size="sm" variant="primary" onClick={speichernKlick} disabled={speichern}>
                  {speichern ? 'Speichern…' : 'Speichern'}
                </Button>
              </div>
            </div>
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
