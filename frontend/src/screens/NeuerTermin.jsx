import React from 'react';
import Button from '../components/atoms/Button.jsx';
import Icon from '../components/atoms/Icon.jsx';

/* Neuer Termin — Wizard-Form für eine neue Kampagnen-Session.
   Layout: Step-Header oben, Form-Card mittig, Vorschau rechts. */

//   THIS IS THE NEW CAMPAIGN TAB

/* Standard-Zeitoption: heutiges Datum, Start = jetzt + 2 h, Ende = jetzt + 4 h. */
function standardOption() {
  const d = new Date();
  const datum  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const minute = String(d.getMinutes()).padStart(2, "0");
  const von = `${String((d.getHours() + 2) % 24).padStart(2, "0")}:${minute}`;
  const bis = `${String((d.getHours() + 4) % 24).padStart(2, "0")}:${minute}`;
  return { id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, datum, von, bis };
}

export default function NeuerTermin({ tweaks, user, onNavigate, onCreateTermin }) {
  const [groups, setGroups] = React.useState([]);
  const [campaigns, setCampaigns] = React.useState([]);

  React.useEffect(() => {
    const headers = { Authorization: 'Bearer ' + localStorage.getItem('cc_access') };
    fetch('/api/gruppen/', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(setGroups)
      .catch(() => {});
    fetch('/api/kampagnen/', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCampaigns(data.map(c => ({ ...c, title: c.titel, desc: c.beschreibung }))))
      .catch(() => {});
  }, []);

  const [form, setForm] = React.useState({
    gruppe: "",
    kampagne: "",
    // options: allow multiple date/time choices for a poll
    options: [standardOption()],
    wiederholung: false,
    erinnerung: false,
    beschreibung: "",
  });

  const selectedGroup = groups?.find(g => g.id === form.gruppe);
  const selectedCampaign = campaigns?.find(c => c.id === form.kampagne);

  const setValue = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const setOption = (index, key, value) => setForm(f => ({
    ...f,
    options: f.options.map((o, i) => i === index ? { ...o, [key]: value } : o)
  }));

  const addOption = () => setForm(f => ({
    ...f,
    options: [...f.options, standardOption()]
  }));

  const removeOption = (index) => setForm(f => ({
    ...f,
    options: f.options.filter((_, i) => i !== index)
  }));

  const formatDate = (rawDate) => {
    if (!rawDate) return "";
    const [year, month, day] = rawDate.split('-');
    return `${day}.${month}.${year}`;
  };

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + localStorage.getItem('cc_access'),
    };
    try {
      if (form.options.length > 1) {
        // Mehrere Optionen → Terminumfrage zur Abstimmung erstellen
        const res = await fetch(`/api/kampagnen/${form.kampagne}/umfragen/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            beschreibung: form.beschreibung.trim(),
            optionen: form.options.map(o => ({ datum: formatDate(o.datum), von: o.von, bis: o.bis })),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || 'Umfrage konnte nicht erstellt werden.');
        }
      } else {
        // Eine Option → direkt eine Session anlegen
        const option = form.options[0];
        const res = await fetch(`/api/kampagnen/${form.kampagne}/sessions/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            datum: formatDate(option.datum),
            von: option.von,
            bis: option.bis,
            beschreibung: form.beschreibung.trim(),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.detail || data?.datum?.[0] || 'Termin konnte nicht erstellt werden.');
        }
      }
      onNavigate?.('questboard');
    } catch (err) {
      setError(err.message || 'Fehler beim Erstellen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "32px 32px 0", maxWidth: 1440, margin: "0 auto" }}>
      <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 48px)", margin: "0 0 32px 0" }}>
        Neuer Termin anlegen
      </h1>

      <form onSubmit={submit} style={{
        background: "var(--cc-surface)", border: "1px solid var(--cc-border-soft)",
        borderRadius: 14, padding: 32,
        display: "flex", flexDirection: "column", gap: 24,
        maxWidth: 900,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Welche Gruppe">
            <select
              style={{ ...inp(), cursor: 'pointer' }}
              value={form.gruppe}
              onChange={e => setValue('gruppe', e.target.value)}
              required
            >
              <option value="">Gruppe auswählen</option>
              {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </Field>
          <Field label="Welche Kampagne">
            <select
              style={{ ...inp(), cursor: 'pointer' }}
              value={form.kampagne}
              onChange={e => setValue('kampagne', e.target.value)}
              required
            >
              <option value="">Kampagne auswählen</option>
              {campaigns?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </Field>
        </div>

        {(selectedGroup || selectedCampaign) && (
          <div style={{ background: 'rgba(233,160,81,.08)', border: '1px solid rgba(233,160,81,.3)', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Gruppe</div>
                <div style={{ color: 'var(--cc-text-soft)' }}>{selectedGroup.name}</div>
                <div style={{ marginTop: 8, fontSize: 13 }}>{selectedGroup.membersList?.length ?? 0} Mitglieder</div>
              </div>
              {selectedCampaign && (
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Kampagne</div>
                  <div style={{ color: 'var(--cc-text-soft)' }}>{selectedCampaign.title}</div>
                  <div style={{ marginTop: 8, fontSize: 13 }}>{selectedCampaign.desc}</div>
                </div>
              )}
            </div>
            {selectedGroup.membersList?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selectedGroup.membersList.map((member, index) => (
                  <div key={index} style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--cc-bg)', color: 'var(--cc-text)', fontSize: 13 }}>
                    {member}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cc-text-soft)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Terminvorschläge</div>
            <button type="button" onClick={addOption} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', cursor: 'pointer', background: 'transparent', border: 'none' }}>
              <Icon name="plus" /> <span style={{ fontSize: 13 }}>Weitere Zeitoption</span>
            </button>
          </div>

          {form.options.map((opt, idx) => (
            <div key={opt.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 40px', gap: 12, alignItems: 'center' }}>
              <Field label={idx === 0 ? 'Datum' : `Datum (${idx + 1})`}>
                <input type="date" style={inp()} value={opt.datum} onChange={e => setOption(idx, 'datum', e.target.value)} required />
              </Field>
              <Field label={idx === 0 ? 'Startzeit' : 'Startzeit'}>
                <input type="time" style={inp()} value={opt.von} onChange={e => setOption(idx, 'von', e.target.value)} required />
              </Field>
              <Field label={idx === 0 ? 'Endzeit' : 'Endzeit'}>
                <input type="time" style={inp()} value={opt.bis} onChange={e => setOption(idx, 'bis', e.target.value)} required />
              </Field>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {form.options.length > 1 && (
                  <button type="button" onClick={() => removeOption(idx)} title="Option entfernen" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--cc-border-soft)', background: 'var(--cc-surface)', cursor: 'pointer' }}>−</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.wiederholung}
              onChange={e => setValue('wiederholung', e.target.checked)}
              style={{ cursor: 'pointer', width: 18, height: 18 }}
            />
            <span style={{ fontSize: 14 }}>Wiederholung wöchentlich</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.erinnerung}
              onChange={e => setValue('erinnerung', e.target.checked)}
              style={{ cursor: 'pointer', width: 18, height: 18 }}
            />
            <span style={{ fontSize: 14 }}>Erinnerung eine Stunde davor</span>
          </label>
        </div>

        <Field label="Beschreibung und Notizen">
          <textarea
            rows={5}
            style={{ ...inp(), resize: 'vertical', lineHeight: 1.5 }}
            placeholder="Beschreibe hier deine Infos zum Termin"
            value={form.beschreibung}
            onChange={e => setValue('beschreibung', e.target.value)}
          />
        </Field>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(220,50,50,.1)', color: '#c0392b', fontSize: 13 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="primary" type="button" onClick={() => onNavigate?.('questboard')}>
            Abbrechen
          </Button>
          <Button type="submit" variant="dark" leading={<Icon name="check" size={16} />} disabled={submitting}>
            {submitting ? 'Wird gespeichert…' : 'Als Termin festlegen'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function inp() {
  return {
    width: "100%", padding: "10px 12px", border: "1px solid var(--cc-border-soft)", borderRadius: 6,
    fontSize: 14, fontFamily: "inherit", background: "var(--cc-surface)", color: "var(--cc-text)",
  };
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cc-text-soft)", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</span>
      {children}
    </label>
  );
}
